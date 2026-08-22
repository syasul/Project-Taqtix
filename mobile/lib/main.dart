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
      themeMode: ThemeMode.light,
      theme: ThemeData(
        brightness: Brightness.light,
        primaryColor: const Color(0xFF4F46E5), // Indigo branding
        scaffoldBackgroundColor: const Color(0xFFF9FAFB), // Soft gray/white
        colorScheme: const ColorScheme.light(
          primary: Color(0xFF4F46E5),
          secondary: Color(0xFF10B981), // Emerald Accent
          surface: Colors.white,
          onPrimary: Colors.white,
          onSecondary: Colors.white,
          onSurface: Color(0xFF111827),
        ),
        useMaterial3: true,
      ),
      home: homeWidget,
    );
  }
}
