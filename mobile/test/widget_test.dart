import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/main.dart';
import 'package:mobile/features/auth/auth_provider.dart';

class MockAuthNotifier extends AuthNotifier {
  MockAuthNotifier(super.ref) {
    state = AuthState.unauthenticated();
  }

  @override
  Future<void> checkAuth() async {
    // Skip reading secure storage in test environment
  }
}

void main() {
  testWidgets('App renders login screen initially', (WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authProvider.overrideWith((ref) => MockAuthNotifier(ref)),
        ],
        child: const TaqTixApp(),
      ),
    );

    await tester.pump();

    // Verify login screen header text is present
    expect(find.text('TAQtix Gate Staff'), findsOneWidget);
  });
}
