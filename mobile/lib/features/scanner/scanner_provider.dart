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

  Future<ScanResult> checkInQR({required String qrPayload, required String eventId}) async {
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
          },
        );

        final data = response.data;
        if (data != null && data['success'] == true) {
          final ticketData = data['data']['ticket'];
          final ticketId = ticketData['id'] as String;
          final attendee = ticketData['orderItem']?['attendeeName'] as String?;
          final category = ticketData['orderItem']?['ticketCategory']?['name'] as String?;

          // Update local cache
          await isar.writeTxn(() async {
            final cache = await isar.ticketCaches.filter().ticketIdEqualTo(ticketId).findFirst();
            if (cache != null) {
              cache.status = 'CHECKED_IN';
              await isar.ticketCaches.put(cache);
            } else {
              await isar.ticketCaches.put(
                TicketCache()
                  ..ticketId = ticketId
                  ..eventId = eventId
                  ..qrPayload = qrPayload
                  ..buyerName = attendee ?? ''
                  ..categoryName = category ?? ''
                  ..status = 'CHECKED_IN',
              );
            }

            // Save Synced ScanLog
            await isar.scanLogs.put(
              ScanLog()
                ..ticketId = ticketId
                ..qrPayload = qrPayload
                ..scannedAt = DateTime.now()
                ..synced = true
                ..status = 'SUCCESS',
            );
          });

          return ScanResult(
            status: ScanResultStatus.valid,
            title: 'TIKET VALID (ONLINE)',
            message: 'Silakan masuk. Check-in berhasil diverifikasi di server.',
            attendee: attendee,
            category: category,
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
            );
          }

          return ScanResult(
            status: ScanResultStatus.invalid,
            title: 'TIKET INVALID (ONLINE)',
            message: message,
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
          );
        }

        return ScanResult(
          status: ScanResultStatus.invalid,
          title: 'TIKET INVALID (ONLINE)',
          message: message,
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
      final timeStr = logs != null ? DateFormat('HH:mm').format(logs.scannedAt) : null;

      return ScanResult(
        status: ScanResultStatus.duplicate,
        title: 'DUPLIKAT SCAN (OFFLINE)',
        message: 'Tiket ini sudah pernah di-scan masuk sebelumnya.',
        attendee: cache.buyerName,
        category: cache.categoryName,
        time: timeStr,
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
    );
  }

  Future<ScanResult> checkInManual({required String ticketId, required String eventId}) async {
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
          },
        );

        final data = response.data;
        if (data != null && data['success'] == true) {
          final ticketData = data['data']['ticket'];
          final attendee = ticketData['orderItem']?['attendeeName'] as String?;
          final category = ticketData['orderItem']?['ticketCategory']?['name'] as String?;

          // Update local cache
          await isar.writeTxn(() async {
            final cache = await isar.ticketCaches.filter().ticketIdEqualTo(ticketId).findFirst();
            if (cache != null) {
              cache.status = 'CHECKED_IN';
              await isar.ticketCaches.put(cache);
            } else {
              await isar.ticketCaches.put(
                TicketCache()
                  ..ticketId = ticketId
                  ..eventId = eventId
                  ..qrPayload = ticketId
                  ..buyerName = attendee ?? ''
                  ..categoryName = category ?? ''
                  ..status = 'CHECKED_IN',
              );
            }

            // Save Synced ScanLog
            await isar.scanLogs.put(
              ScanLog()
                ..ticketId = ticketId
                ..qrPayload = ticketId
                ..scannedAt = DateTime.now()
                ..synced = true
                ..status = 'SUCCESS',
            );
          });

          return ScanResult(
            status: ScanResultStatus.valid,
            title: 'CHECK-IN MANUAL BERHASIL (ONLINE)',
            message: 'Check-in manual berhasil diverifikasi di server.',
            attendee: attendee,
            category: category,
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
            );
          }

          return ScanResult(
            status: ScanResultStatus.invalid,
            title: 'TIKET INVALID (ONLINE)',
            message: message,
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
          );
        }

        return ScanResult(
          status: ScanResultStatus.invalid,
          title: 'TIKET INVALID (ONLINE)',
          message: message,
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
      final timeStr = logs != null ? DateFormat('HH:mm').format(logs.scannedAt) : null;

      return ScanResult(
        status: ScanResultStatus.duplicate,
        title: 'DUPLIKAT CHECK-IN (OFFLINE)',
        message: 'Tiket ini sudah pernah di-check in sebelumnya.',
        attendee: cache.buyerName,
        category: cache.categoryName,
        time: timeStr,
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
    );
  }
}
