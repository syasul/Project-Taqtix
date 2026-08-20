import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../event_select/event_list_screen.dart';
import 'scanner_provider.dart';
import 'scan_result_widget.dart';

class ManualCheckinScreen extends ConsumerStatefulWidget {
  const ManualCheckinScreen({super.key});

  @override
  ConsumerState<ManualCheckinScreen> createState() => _ManualCheckinScreenState();
}

class _ManualCheckinScreenState extends ConsumerState<ManualCheckinScreen> {
  final _formKey = GlobalKey<FormState>();
  final _codeController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    
    final code = _codeController.text.trim();
    final activeEvent = ref.read(activeEventProvider);
    if (activeEvent == null) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final service = ref.read(scannerProvider);
      final result = await service.checkInManual(
        ticketId: code,
        eventId: activeEvent.id,
      );

      if (mounted) {
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (_) => ScanResultWidget(
            result: result,
            onClose: () {
              Navigator.pop(context); // Close bottom sheet
              setState(() {
                _codeController.clear();
              });
            },
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Terjadi kesalahan sistem.'),
            backgroundColor: Color(0xFFEF4444),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final activeEvent = ref.watch(activeEventProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Input Kode Tiket',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (activeEvent != null) ...[
              Text(
                'Event: ${activeEvent.title}',
                style: const TextStyle(fontSize: 14, color: Colors.grey, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 16),
            ],
            const Text(
              'Gunakan jika barcode/QR Code rusak dan tidak terbaca kamera scanner.',
              style: TextStyle(fontSize: 13, color: Colors.white70),
            ),
            const SizedBox(height: 32),

            Form(
              key: _formKey,
              child: TextFormField(
                controller: _codeController,
                textInputAction: TextInputAction.done,
                onFieldSubmitted: (_) => _submit(),
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 1),
                decoration: InputDecoration(
                  labelText: 'Kode Tiket (UUID / Ticket Code)',
                  labelStyle: const TextStyle(color: Colors.grey),
                  prefixIcon: const Icon(Icons.keyboard_outlined, color: Colors.grey),
                  filled: true,
                  fillColor: const Color(0xFF1E1F29),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16.0),
                    borderSide: BorderSide.none,
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16.0),
                    borderSide: const BorderSide(color: Color(0xFF6366F1), width: 1.5),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Silakan masukkan kode tiket';
                  }
                  return null;
                },
              ),
            ),
            const SizedBox(height: 24),

            ElevatedButton(
              onPressed: _isLoading ? null : _submit,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16.0),
                backgroundColor: const Color(0xFF6366F1),
                foregroundColor: Colors.white,
                disabledBackgroundColor: const Color(0xFF6366F1).withOpacity(0.5),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16.0),
                ),
              ),
              child: _isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Text(
                      'Check-in Tiket',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
