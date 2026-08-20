import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'core/local_db/isar_service.dart';
import 'features/auth/auth_provider.dart';
import 'features/auth/gate_login_screen.dart';
import 'features/event_select/event_list_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize date formatting locales
  await initializeDateFormatting('id', null);
  
  // Initialize local database schemas
  final isar = await IsarService.init();

  runApp(
    ProviderScope(
      overrides: [
        isarProvider.overrideWithValue(isar),
      ],
      child: const TaqTixApp(),
    ),
  );
}

class TaqTixApp extends ConsumerWidget {
  const TaqTixApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    Widget homeWidget;
    if (authState.isLoading) {
      homeWidget = const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFF6366F1)),
        ),
      );
    } else if (authState.isAuthenticated) {
      homeWidget = const EventListScreen();
    } else {
      homeWidget = const GateLoginScreen();
    }

    return MaterialApp(
      title: 'TAQtix Gate Staff',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFF6366F1), // Indigo branding
        scaffoldBackgroundColor: const Color(0xFF090A0F), // Dark slate
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF6366F1),
          secondary: Color(0xFF10B981), // Emerald Accent
          surface: Color(0xFF1E1F29),
        ),
        useMaterial3: true,
      ),
      home: homeWidget,
    );
  }
}
