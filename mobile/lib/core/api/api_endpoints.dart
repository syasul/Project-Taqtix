import 'dart:io';

class ApiEndpoints {
  static final String baseUrl = Platform.isAndroid
      ? 'http://10.0.2.2:3001/v1'
      : 'http://localhost:3001/v1';
  
  static const String login = '/auth/gate-login';
  static const String events = '/gate/events';
  
  static String manifest(String eventId) => '/gate/events/$eventId/manifest';
  
  static const String scan = '/gate/scan';
  static const String scanBatch = '/gate/scan/batch';
  static const String manualCheckin = '/gate/manual-checkin';
}
