import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:isar/isar.dart';
import 'package:path_provider/path_provider.dart';
import 'models/ticket_cache.dart';
import 'models/scan_log.dart';

final isarProvider = Provider<Isar>((ref) {
  throw UnimplementedError('Isar has not been initialized');
});

class IsarService {
  static Future<Isar> init() async {
    final dir = await getApplicationDocumentsDirectory();
    return Isar.open(
      [TicketCacheSchema, ScanLogSchema],
      directory: dir.path,
    );
  }
}
