import 'package:isar/isar.dart';

part 'ticket_cache.g.dart';

@collection
class TicketCache {
  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String ticketId;

  late String qrPayload;

  late String eventId;
  late String categoryName;
  late String buyerName;
  late String status; // 'VALID' or 'CHECKED_IN'
}
