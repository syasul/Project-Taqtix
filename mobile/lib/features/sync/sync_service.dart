import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:isar/isar.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/api/dio_client.dart';
import '../../core/local_db/isar_service.dart';
import '../../core/local_db/models/scan_log.dart';

final unsyncedLogsCountProvider = StreamProvider<int>((ref) {
  final isar = ref.watch(isarProvider);
  return isar.scanLogs
      .filter()
      .syncedEqualTo(false)
      .watch(fireImmediately: true)
      .map((logs) => logs.length);
});

class SyncNotifier extends StateNotifier<bool> {
  final Ref ref;

  SyncNotifier(this.ref) : super(false);

  Future<void> syncLogs() async {
    if (state) return; // Already syncing

    final isar = ref.read(isarProvider);
    final unsynced = await isar.scanLogs
        .filter()
        .syncedEqualTo(false)
        .findAll();
    if (unsynced.isEmpty) return;

    state = true;
    try {
      final dio = ref.read(dioProvider);

      final ticketLogs = unsynced.where((log) => log.status != 'CREW_PENDING').toList();
      final crewLogs = unsynced.where((log) => log.status == 'CREW_PENDING').toList();

      // 1. Sync Ticket Logs in batch
      if (ticketLogs.isNotEmpty) {
        final payload = ticketLogs
            .map(
              (log) => {
                'qrPayload': log.qrPayload,
                'scannedAt': log.scannedAt.toUtc().toIso8601String(),
              },
            )
            .toList();

        final response = await dio.post(
          ApiEndpoints.scanBatch,
          data: {'logs': payload},
        );

        final data = response.data;
        if (data != null && data['success'] == true) {
          await isar.writeTxn(() async {
            for (final log in ticketLogs) {
              log.synced = true;
              await isar.scanLogs.put(log);
            }
          });
        }
      }

      // 2. Sync Crew Logs one by one
      if (crewLogs.isNotEmpty) {
        for (final log in crewLogs) {
          try {
            final response = await dio.post(
              '/gate/workforce-scan',
              data: {'qrPayload': log.qrPayload},
            );
            if (response.data != null && response.data['success'] == true) {
              await isar.writeTxn(() async {
                log.synced = true;
                log.status = 'CREW_SUCCESS';
                await isar.scanLogs.put(log);
              });
            }
          } catch (e) {
            // Keep unsynced for next retry
          }
        }
      }
    } on DioException catch (e) {
      print('Sync failed due to connectivity: ${e.message}');
    } catch (e) {
      print('Sync failed due to: $e');
    } finally {
      state = false;
    }
  }
}

final syncProvider = StateNotifierProvider<SyncNotifier, bool>((ref) {
  return SyncNotifier(ref);
});
