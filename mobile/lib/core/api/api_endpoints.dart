class ApiEndpoints {
  static const String baseUrl = 'http://localhost:3000/v1'; // Default local development URL
  
  static const String login = '/auth/gate-login';
  static const String events = '/gate/events';
  
  static String manifest(String eventId) => '/gate/events/$eventId/manifest';
  
  static const String scan = '/gate/scan';
  static const String scanBatch = '/gate/scan/batch';
  static const String manualCheckin = '/gate/manual-checkin';
}
