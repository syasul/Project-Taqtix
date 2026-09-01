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
          child: CircularProgressIndicator(color: Color(0xFF08B4B5)),
        ),
      );
    } else if (authState.isAuthenticated) {
      homeWidget = const EventListScreen();
    } else {
      homeWidget = const GateLoginScreen();
    }

    return MaterialApp(
      title: 'TAQtix',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.light,
      theme: ThemeData(
        brightness: Brightness.light,
        primaryColor: const Color(0xFF08B4B5), // Teal branding
        scaffoldBackgroundColor: const Color(0xFFF9FAFB),
        colorScheme: const ColorScheme.light(
          primary: Color(0xFF08B4B5), // Teal
          secondary: Color(0xFFF1B829), // Amber / Gold
          surface: Colors.white,
          onPrimary: Colors.white,
          onSecondary: Colors.black,
          onSurface: Color(0xFF111827),
        ),
        useMaterial3: true,
      ),
      home: homeWidget,
    );
  }
}
