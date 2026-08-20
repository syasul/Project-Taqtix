import 'package:isar/isar.dart';

part 'scan_log.g.dart';

@collection
class ScanLog {
  Id id = Isar.autoIncrement;

  late String ticketId;
  late String qrPayload;

  late DateTime scannedAt;
  late bool synced;
  late String status; // 'SUCCESS' | 'DUPLICATE' | 'INVALID'
}
