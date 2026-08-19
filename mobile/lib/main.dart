import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/**
 * Titik masuk utama (entry point) aplikasi Mobile TAQtix.
 * Menggunakan [ProviderScope] dari Riverpod untuk pengelolaan state global.
 */
void main() {
  runApp(
    const ProviderScope(
      child: TaqTixApp(),
    ),
  );
}

/**
 * Widget akar aplikasi TAQtix.
 */
class TaqTixApp extends StatelessWidget {
  const TaqTixApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TAQtix Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFF6366F1), // Indigo
        scaffoldBackgroundColor: const Color(0xFF090A0F), // Dark slate
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF6366F1),
          secondary: Color(0xFF10B981), // Emerald
          surface: Color(0xFF1E1F29),
        ),
        useMaterial3: true,
      ),
      home: const DashboardScreen(),
    );
  }
}

/**
 * Halaman utama / Dashboard Scanner TAQtix Mobile.
 */
class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'TAQtix Gate Staff',
          style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 0.5),
        ),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Status Card
            Container(
              padding: const EdgeInsets.all(20.0),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20.0),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF6366F1).withOpacity(0.3),
                    blurRadius: 15,
                    offset: const Offset(0, 5),
                  )
                ],
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Gate Staff Dashboard',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Siap melakukan validasi e-ticket pembeli di gerbang acara.',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            
            // Scanner Action Button
            Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      height: 140,
                      width: 140,
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E1F29),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: const Color(0xFF6366F1).withOpacity(0.5),
                          width: 2.0,
                        ),
                      ),
                      child: InkWell(
                        onTap: () {
                          // TODO: Implementasikan QR Scanner di Fase 2
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Fitur QR Scanner akan diaktifkan setelah integrasi kamera.'),
                              backgroundColor: Color(0xFF6366F1),
                            ),
                          );
                        },
                        borderRadius: BorderRadius.circular(70),
                        child: const Icon(
                          Icons.qr_code_scanner,
                          size: 64,
                          color: Color(0xFF6366F1),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Ketuk untuk Memulai Scan QR',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Mendukung verifikasi offline & online',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
