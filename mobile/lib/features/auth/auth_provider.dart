import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/api/dio_client.dart';

class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final String? email;
  final String? error;

  AuthState({
    required this.isAuthenticated,
    required this.isLoading,
    this.email,
    this.error,
  });

  factory AuthState.initial() => AuthState(isAuthenticated: false, isLoading: false);
  factory AuthState.loading() => AuthState(isAuthenticated: false, isLoading: true);
  factory AuthState.authenticated(String email) => AuthState(isAuthenticated: true, isLoading: false, email: email);
  factory AuthState.unauthenticated({String? error}) => AuthState(isAuthenticated: false, isLoading: false, error: error);
}

class AuthNotifier extends StateNotifier<AuthState> {
  final Ref ref;

  AuthNotifier(this.ref) : super(AuthState.initial()) {
    checkAuth();
  }

  Future<void> checkAuth() async {
    state = AuthState.loading();
    try {
      final storage = ref.read(secureStorageProvider);
      final token = await storage.read(key: 'gate_token');
      if (token != null && token.isNotEmpty) {
        final isExpired = JwtDecoder.isExpired(token);
        if (!isExpired) {
          final decoded = JwtDecoder.decode(token);
          final email = decoded['email'] as String?;
          state = AuthState.authenticated(email ?? 'Staff Gate');
          return;
        }
      }
      state = AuthState.unauthenticated();
    } catch (e) {
      state = AuthState.unauthenticated();
    }
  }

  Future<bool> login(String email, String password) async {
    state = AuthState.loading();
    try {
      final dio = ref.read(dioProvider);
      final response = await dio.post(
        ApiEndpoints.login,
        data: {
          'email': email,
          'password': password,
        },
      );

      final data = response.data;
      if (data != null && data['success'] == true) {
        final token = data['data']['accessToken'] as String;
        final storage = ref.read(secureStorageProvider);
        await storage.write(key: 'gate_token', value: token);

        final decoded = JwtDecoder.decode(token);
        final userEmail = decoded['email'] as String?;
        state = AuthState.authenticated(userEmail ?? email);
        return true;
      } else {
        final message = data?['error']?['message'] ?? 'Email atau password salah';
        state = AuthState.unauthenticated(error: message);
        return false;
      }
    } on DioException catch (e) {
      final message = e.response?.data?['error']?['message'] ?? 'Gagal menghubungi server';
      state = AuthState.unauthenticated(error: message);
      return false;
    } catch (e) {
      state = AuthState.unauthenticated(error: 'Terjadi kesalahan sistem');
      return false;
    }
  }

  Future<void> logout() async {
    final storage = ref.read(secureStorageProvider);
    await storage.delete(key: 'gate_token');
    state = AuthState.unauthenticated();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref);
});
