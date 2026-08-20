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
    final unsynced = await isar.scanLogs.filter().syncedEqualTo(false).findAll();
    if (unsynced.isEmpty) return;

    state = true;
    try {
      final dio = ref.read(dioProvider);
      final payload = unsynced.map((log) => {
        'qrPayload': log.qrPayload,
        'scannedAt': log.scannedAt.toUtc().toIso8601String(),
      }).toList();

      final response = await dio.post(
        ApiEndpoints.scanBatch,
        data: {
          'logs': payload,
        },
      );

      final data = response.data;
      if (data != null && data['success'] == true) {
        // Sync succeeded
        await isar.writeTxn(() async {
          for (final log in unsynced) {
            log.synced = true;
            await isar.scanLogs.put(log);
          }
        });
      }
    } on DioException catch (e) {
      // Ignored for background sync (retry later)
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
