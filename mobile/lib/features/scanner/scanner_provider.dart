import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:isar/isar.dart';
import 'package:intl/intl.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/api/dio_client.dart';
import '../../core/local_db/isar_service.dart';
import '../../core/local_db/models/ticket_cache.dart';
import '../../core/local_db/models/scan_log.dart';
import 'scan_result_widget.dart';

final scannerProvider = Provider((ref) => ScannerService(ref));

class ScannerService {
  final Ref ref;

  ScannerService(this.ref);

  Future<ScanResult> checkInQR({required String qrPayload, required String eventId, String action = 'in'}) async {
    final connectivity = await Connectivity().checkConnectivity();
    final isOnline = connectivity != ConnectivityResult.none;

    final isar = ref.read(isarProvider);

    if (isOnline) {
      try {
        final dio = ref.read(dioProvider);
        final response = await dio.post(
          ApiEndpoints.scan,
          data: {
            'eventId': eventId,
            'qrPayload': qrPayload,
            'action': action,
          },
        );

        final data = response.data;
        if (data != null && data['success'] == true) {
          final ticketData = data['data']['ticket'];
          final ticketId = ticketData['id'] as String;
          final attendee = ticketData['orderItem']?['attendeeName'] as String?;
          final category = ticketData['orderItem']?['ticketCategory']?['name'] as String?;
          final checkedInAtStr = ticketData['checkedInAt'] as String?;
          final checkedOutAtStr = ticketData['checkedOutAt'] as String?;

          String? checkedInTime;
          String? checkedOutTime;

          if (checkedInAtStr != null) {
            final dt = DateTime.parse(checkedInAtStr).toLocal();
            checkedInTime = DateFormat('HH:mm:ss').format(dt);
          }
          if (checkedOutAtStr != null) {
            final dt = DateTime.parse(checkedOutAtStr).toLocal();
            checkedOutTime = DateFormat('HH:mm:ss').format(dt);
          }

          // Update local cache
          await isar.writeTxn(() async {
            final cache = await isar.ticketCaches.filter().ticketIdEqualTo(ticketId).findFirst();
            final newStatus = action == 'out' ? 'VALID' : 'CHECKED_IN';
            if (cache != null) {
              cache.status = newStatus;
              await isar.ticketCaches.put(cache);
            } else {
              await isar.ticketCaches.put(
                TicketCache()
                  ..ticketId = ticketId
                  ..eventId = eventId
                  ..qrPayload = qrPayload
                  ..buyerName = attendee ?? ''
                  ..categoryName = category ?? ''
                  ..status = newStatus,
              );
            }

            // Save Synced ScanLog
            await isar.scanLogs.put(
              ScanLog()
                ..ticketId = ticketId
                ..qrPayload = qrPayload
                ..scannedAt = DateTime.now()
                ..synced = true
                ..status = action == 'out' ? 'CHECK_OUT' : 'SUCCESS',
            );
          });

          return ScanResult(
            status: ScanResultStatus.valid,
            title: action == 'out' ? 'CHECK-OUT VALID (ONLINE)' : 'TIKET VALID (ONLINE)',
            message: action == 'out'
                ? 'Check-out berhasil diverifikasi di server.'
                : 'Silakan masuk. Check-in berhasil diverifikasi di server.',
            attendee: attendee,
            category: category,
            time: DateFormat('HH:mm:ss').format(DateTime.now()),
            timeLabel: action == 'out' ? 'Waktu Keluar' : 'Waktu Masuk',
            checkedInTime: checkedInTime,
            checkedOutTime: checkedOutTime,
          );
        } else {
          final error = data?['error'];
          final code = error?['code'] as String?;
          final message = error?['message'] as String? ?? 'Gagal memvalidasi tiket';

          if (code == 'TICKET_ALREADY_USED') {
            // Local update status
            final ticketId = error?['details']?['ticketId'] as String?;
            if (ticketId != null) {
              await isar.writeTxn(() async {
                final cache = await isar.ticketCaches.filter().ticketIdEqualTo(ticketId).findFirst();
                if (cache != null) {
                  cache.status = 'CHECKED_IN';
                  await isar.ticketCaches.put(cache);
                }
              });
            }
            return ScanResult(
              status: ScanResultStatus.duplicate,
              title: 'DUPLIKAT SCAN (ONLINE)',
              message: message,
              time: DateFormat('HH:mm:ss').format(DateTime.now()),
              timeLabel: 'Waktu Masuk',
            );
          }

          return ScanResult(
            status: ScanResultStatus.invalid,
            title: 'TIKET INVALID (ONLINE)',
            message: message,
            time: DateFormat('HH:mm:ss').format(DateTime.now()),
            timeLabel: 'Waktu Scan',
          );
        }
      } on DioException catch (e) {
        final errData = e.response?.data;
        final message = errData?['error']?['message'] as String? ?? 'Koneksi ke server terputus';
        final code = errData?['error']?['code'] as String?;

        if (code == 'TICKET_ALREADY_USED') {
          return ScanResult(
            status: ScanResultStatus.duplicate,
            title: 'DUPLIKAT SCAN (ONLINE)',
            message: message,
            time: DateFormat('HH:mm:ss').format(DateTime.now()),
            timeLabel: 'Waktu Masuk',
          );
        }

        return ScanResult(
          status: ScanResultStatus.invalid,
          title: 'TIKET INVALID (ONLINE)',
          message: message,
          time: DateFormat('HH:mm:ss').format(DateTime.now()),
          timeLabel: 'Waktu Scan',
        );
      } catch (e) {
        // Fallback to local check if online request fails
      }
    }

    // --- OFFLINE CHECK / FALLBACK ---
    final cache = await isar.ticketCaches
        .filter()
        .eventIdEqualTo(eventId)
        .and()
        .group((q) => q.qrPayloadEqualTo(qrPayload).or().ticketIdEqualTo(qrPayload))
        .findFirst();

    if (cache == null) {
      // Record failed ScanLog
      await isar.writeTxn(() async {
        await isar.scanLogs.put(
          ScanLog()
            ..ticketId = qrPayload
            ..qrPayload = qrPayload
            ..scannedAt = DateTime.now()
            ..synced = false
            ..status = 'INVALID',
        );
      });

      return ScanResult(
        status: ScanResultStatus.invalid,
        title: 'TIKET INVALID (OFFLINE)',
        message: 'Tiket tidak ditemukan di cache manifest event ini. Pastikan manifest sudah diunduh.',
        time: DateFormat('HH:mm:ss').format(DateTime.now()),
        timeLabel: 'Waktu Scan',
      );
    }

    final isOut = action == 'out';

    if (isOut) {
      if (cache.status != 'CHECKED_IN') {
        await isar.writeTxn(() async {
          await isar.scanLogs.put(
            ScanLog()
              ..ticketId = cache.ticketId
              ..qrPayload = cache.qrPayload
              ..scannedAt = DateTime.now()
              ..synced = false
              ..status = 'INVALID_OUT',
          );
        });
        return ScanResult(
          status: ScanResultStatus.invalid,
          title: 'CHECK-OUT INVALID (OFFLINE)',
          message: 'Tiket belum check-in masuk (tidak bisa check-out).',
          attendee: cache.buyerName,
          category: cache.categoryName,
          time: DateFormat('HH:mm:ss').format(DateTime.now()),
          timeLabel: 'Waktu Keluar',
        );
      }

      // Valid check-out offline
      await isar.writeTxn(() async {
        cache.status = 'VALID';
        await isar.ticketCaches.put(cache);

        await isar.scanLogs.put(
          ScanLog()
            ..ticketId = cache.ticketId
            ..qrPayload = cache.qrPayload
            ..scannedAt = DateTime.now()
            ..synced = false
            ..status = 'CHECK_OUT',
        );
      });

      return ScanResult(
        status: ScanResultStatus.valid,
        title: 'CHECK-OUT VALID (OFFLINE)',
        message: 'Check-out sukses. Disimpan di cache lokal (belum ter-sync).',
        attendee: cache.buyerName,
        category: cache.categoryName,
        time: DateFormat('HH:mm:ss').format(DateTime.now()),
        timeLabel: 'Waktu Keluar',
      );
    }

    if (cache.status == 'CHECKED_IN') {
      // Record duplicate scan log
      await isar.writeTxn(() async {
        await isar.scanLogs.put(
          ScanLog()
            ..ticketId = cache.ticketId
            ..qrPayload = cache.qrPayload
            ..scannedAt = DateTime.now()
            ..synced = false
            ..status = 'DUPLICATE',
        );
      });

      final logs = await isar.scanLogs.filter().ticketIdEqualTo(cache.ticketId).sortByScannedAtDesc().findFirst();
      final timeStr = logs != null ? DateFormat('HH:mm:ss').format(logs.scannedAt) : DateFormat('HH:mm:ss').format(DateTime.now());

      return ScanResult(
        status: ScanResultStatus.duplicate,
        title: 'DUPLIKAT SCAN (OFFLINE)',
        message: 'Tiket ini sudah pernah di-scan masuk sebelumnya.',
        attendee: cache.buyerName,
        category: cache.categoryName,
        time: timeStr,
        timeLabel: 'Waktu Masuk',
      );
    }

    // Valid check-in offline
    await isar.writeTxn(() async {
      cache.status = 'CHECKED_IN';
      await isar.ticketCaches.put(cache);

      await isar.scanLogs.put(
        ScanLog()
          ..ticketId = cache.ticketId
          ..qrPayload = cache.qrPayload
          ..scannedAt = DateTime.now()
          ..synced = false
          ..status = 'SUCCESS',
      );
    });

    return ScanResult(
      status: ScanResultStatus.valid,
      title: 'TIKET VALID (OFFLINE)',
      message: 'Check-in sukses. Disimpan di cache lokal (belum ter-sync).',
      attendee: cache.buyerName,
      category: cache.categoryName,
      time: DateFormat('HH:mm:ss').format(DateTime.now()),
      timeLabel: 'Waktu Masuk',
    );
  }

  Future<ScanResult> checkInManual({required String ticketId, required String eventId, String action = 'in'}) async {
    final connectivity = await Connectivity().checkConnectivity();
    final isOnline = connectivity != ConnectivityResult.none;

    final isar = ref.read(isarProvider);

    if (isOnline) {
      try {
        final dio = ref.read(dioProvider);
        final response = await dio.post(
          ApiEndpoints.manualCheckin,
          data: {
            'eventId': eventId,
            'ticketId': ticketId,
            'action': action,
          },
        );

        final data = response.data;
        if (data != null && data['success'] == true) {
          final ticketData = data['data']['ticket'];
          final attendee = ticketData['orderItem']?['attendeeName'] as String?;
          final category = ticketData['orderItem']?['ticketCategory']?['name'] as String?;
          final checkedInAtStr = ticketData['checkedInAt'] as String?;
          final checkedOutAtStr = ticketData['checkedOutAt'] as String?;

          String? checkedInTime;
          String? checkedOutTime;

          if (checkedInAtStr != null) {
            final dt = DateTime.parse(checkedInAtStr).toLocal();
            checkedInTime = DateFormat('HH:mm:ss').format(dt);
          }
          if (checkedOutAtStr != null) {
            final dt = DateTime.parse(checkedOutAtStr).toLocal();
            checkedOutTime = DateFormat('HH:mm:ss').format(dt);
          }

          // Update local cache
          await isar.writeTxn(() async {
            final cache = await isar.ticketCaches.filter().ticketIdEqualTo(ticketId).findFirst();
            final newStatus = action == 'out' ? 'VALID' : 'CHECKED_IN';
            if (cache != null) {
              cache.status = newStatus;
              await isar.ticketCaches.put(cache);
            } else {
              await isar.ticketCaches.put(
                TicketCache()
                  ..ticketId = ticketId
                  ..eventId = eventId
                  ..qrPayload = ticketId
                  ..buyerName = attendee ?? ''
                  ..categoryName = category ?? ''
                  ..status = newStatus,
              );
            }

            // Save Synced ScanLog
            await isar.scanLogs.put(
              ScanLog()
                ..ticketId = ticketId
                ..qrPayload = ticketId
                ..scannedAt = DateTime.now()
                ..synced = true
                ..status = action == 'out' ? 'CHECK_OUT' : 'SUCCESS',
            );
          });

          return ScanResult(
            status: ScanResultStatus.valid,
            title: action == 'out' ? 'CHECK-OUT MANUAL BERHASIL (ONLINE)' : 'CHECK-IN MANUAL BERHASIL (ONLINE)',
            message: action == 'out'
                ? 'Check-out manual berhasil diverifikasi di server.'
                : 'Check-in manual berhasil diverifikasi di server.',
            attendee: attendee,
            category: category,
            time: DateFormat('HH:mm:ss').format(DateTime.now()),
            timeLabel: action == 'out' ? 'Waktu Keluar' : 'Waktu Masuk',
            checkedInTime: checkedInTime,
            checkedOutTime: checkedOutTime,
          );
        } else {
          final error = data?['error'];
          final code = error?['code'] as String?;
          final message = error?['message'] as String? ?? 'Gagal check-in manual';

          if (code == 'TICKET_ALREADY_USED') {
            await isar.writeTxn(() async {
              final cache = await isar.ticketCaches.filter().ticketIdEqualTo(ticketId).findFirst();
              if (cache != null) {
                cache.status = 'CHECKED_IN';
                await isar.ticketCaches.put(cache);
              }
            });
            return ScanResult(
              status: ScanResultStatus.duplicate,
              title: 'DUPLIKAT CHECK-IN (ONLINE)',
              message: message,
              time: DateFormat('HH:mm:ss').format(DateTime.now()),
              timeLabel: 'Waktu Masuk',
            );
          }

          return ScanResult(
            status: ScanResultStatus.invalid,
            title: 'TIKET INVALID (ONLINE)',
            message: message,
            time: DateFormat('HH:mm:ss').format(DateTime.now()),
            timeLabel: 'Waktu Scan',
          );
        }
      } on DioException catch (e) {
        final errData = e.response?.data;
        final message = errData?['error']?['message'] as String? ?? 'Koneksi ke server terputus';
        final code = errData?['error']?['code'] as String?;

        if (code == 'TICKET_ALREADY_USED') {
          return ScanResult(
            status: ScanResultStatus.duplicate,
            title: 'DUPLIKAT CHECK-IN (ONLINE)',
            message: message,
            time: DateFormat('HH:mm:ss').format(DateTime.now()),
            timeLabel: 'Waktu Masuk',
          );
        }

        return ScanResult(
          status: ScanResultStatus.invalid,
          title: 'TIKET INVALID (ONLINE)',
          message: message,
          time: DateFormat('HH:mm:ss').format(DateTime.now()),
          timeLabel: 'Waktu Scan',
        );
      } catch (e) {
        // Fallback to local check
      }
    }

    // --- OFFLINE CHECK / FALLBACK ---
    final cache = await isar.ticketCaches.filter().eventIdEqualTo(eventId).ticketIdEqualTo(ticketId).findFirst();

    if (cache == null) {
      await isar.writeTxn(() async {
        await isar.scanLogs.put(
          ScanLog()
            ..ticketId = ticketId
            ..qrPayload = ticketId
            ..scannedAt = DateTime.now()
            ..synced = false
            ..status = 'INVALID',
        );
      });

      return ScanResult(
        status: ScanResultStatus.invalid,
        title: 'KODE INVALID (OFFLINE)',
        message: 'Kode tiket tidak ditemukan di cache manifest event ini.',
        time: DateFormat('HH:mm:ss').format(DateTime.now()),
        timeLabel: 'Waktu Scan',
      );
    }

    final isOut = action == 'out';

    if (isOut) {
      if (cache.status != 'CHECKED_IN') {
        await isar.writeTxn(() async {
          await isar.scanLogs.put(
            ScanLog()
              ..ticketId = ticketId
              ..qrPayload = cache.qrPayload
              ..scannedAt = DateTime.now()
              ..synced = false
              ..status = 'INVALID_OUT',
          );
        });
        return ScanResult(
          status: ScanResultStatus.invalid,
          title: 'CHECK-OUT INVALID (OFFLINE)',
          message: 'Tiket belum check-in masuk (tidak bisa check-out).',
          attendee: cache.buyerName,
          category: cache.categoryName,
          time: DateFormat('HH:mm:ss').format(DateTime.now()),
          timeLabel: 'Waktu Keluar',
        );
      }

      // Valid check-out offline
      await isar.writeTxn(() async {
        cache.status = 'VALID';
        await isar.ticketCaches.put(cache);

        await isar.scanLogs.put(
          ScanLog()
            ..ticketId = ticketId
            ..qrPayload = cache.qrPayload
            ..scannedAt = DateTime.now()
            ..synced = false
            ..status = 'CHECK_OUT',
        );
      });

      return ScanResult(
        status: ScanResultStatus.valid,
        title: 'CHECK-OUT MANUAL BERHASIL (OFFLINE)',
        message: 'Check-out manual berhasil disimpan lokal (belum ter-sync).',
        attendee: cache.buyerName,
        category: cache.categoryName,
        time: DateFormat('HH:mm:ss').format(DateTime.now()),
        timeLabel: 'Waktu Keluar',
      );
    }

    if (cache.status == 'CHECKED_IN') {
      await isar.writeTxn(() async {
        await isar.scanLogs.put(
          ScanLog()
            ..ticketId = ticketId
            ..qrPayload = cache.qrPayload
            ..scannedAt = DateTime.now()
            ..synced = false
            ..status = 'DUPLICATE',
        );
      });

      final logs = await isar.scanLogs.filter().ticketIdEqualTo(ticketId).sortByScannedAtDesc().findFirst();
      final timeStr = logs != null ? DateFormat('HH:mm:ss').format(logs.scannedAt) : DateFormat('HH:mm:ss').format(DateTime.now());

      return ScanResult(
        status: ScanResultStatus.duplicate,
        title: 'DUPLIKAT CHECK-IN (OFFLINE)',
        message: 'Tiket ini sudah pernah di-check in sebelumnya.',
        attendee: cache.buyerName,
        category: cache.categoryName,
        time: timeStr,
        timeLabel: 'Waktu Masuk',
      );
    }

    await isar.writeTxn(() async {
      cache.status = 'CHECKED_IN';
      await isar.ticketCaches.put(cache);

      await isar.scanLogs.put(
        ScanLog()
          ..ticketId = ticketId
          ..qrPayload = cache.qrPayload
          ..scannedAt = DateTime.now()
          ..synced = false
          ..status = 'SUCCESS',
      );
    });

    return ScanResult(
      status: ScanResultStatus.valid,
      title: 'CHECK-IN MANUAL BERHASIL (OFFLINE)',
      message: 'Check-in manual berhasil disimpan lokal (belum ter-sync).',
      attendee: cache.buyerName,
      category: cache.categoryName,
      time: DateFormat('HH:mm:ss').format(DateTime.now()),
      timeLabel: 'Waktu Masuk',
    );
  }
}
