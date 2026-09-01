import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../event_select/event_list_screen.dart';
import '../sync/sync_service.dart';
import 'manual_checkin_screen.dart';
import 'scanner_provider.dart';
import 'scan_result_widget.dart';

class ScannerScreen extends ConsumerStatefulWidget {
  const ScannerScreen({super.key});

  @override
  ConsumerState<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends ConsumerState<ScannerScreen> {
  final MobileScannerController _cameraController = MobileScannerController();
  bool _isProcessing = false;
  bool _isCrewMode = false;
  String _scanAction = 'in'; // 'in' (check-in) or 'out' (check-out)

  @override
  void dispose() {
    _cameraController.dispose();
    super.dispose();
  }

  Future<void> _handleScan(String rawValue) async {
    if (_isProcessing) return;

    setState(() {
      _isProcessing = true;
    });

    final activeEvent = ref.read(activeEventProvider);
    if (activeEvent == null) {
      setState(() {
        _isProcessing = false;
      });
      return;
    }

    try {
      // Pause scanner
      await _cameraController.stop();

      final service = ref.read(scannerProvider);
      final result = _isCrewMode
          ? await service.checkInCrew(qrPayload: rawValue)
          : await service.checkInQR(
              qrPayload: rawValue,
              eventId: activeEvent.id,
              action: _scanAction,
            );

      // Trigger auto sync attempt if scan succeeds
      ref.read(syncProvider.notifier).syncLogs();

      if (mounted) {
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          barrierColor: Colors.black.withOpacity(0.5),
          builder: (_) => ScanResultWidget(
            result: result,
            onClose: () async {
              Navigator.pop(context); // Close bottom sheet
              if (mounted) {
                // Resume camera scanner
                setState(() {
                  _isProcessing = false;
                });
                await _cameraController.start();
              }
            },
          ),
        ).then((_) async {
          // Fallback in case sheet is dismissed via tapping outside
          if (_isProcessing) {
            setState(() {
              _isProcessing = false;
            });
            await _cameraController.start();
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
        await _cameraController.start();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final activeEvent = ref.watch(activeEventProvider);
    final unsyncedCount = ref.watch(unsyncedLogsCountProvider).value ?? 0;
    final isSyncing = ref.watch(syncProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          activeEvent?.title ?? 'Scanner Gate',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        actions: [
          // Offline unsynced badge indicator
          if (unsyncedCount > 0)
            Padding(
              padding: const EdgeInsets.only(right: 12.0),
              child: Center(
                child: ActionChip(
                  avatar: isSyncing
                      ? const SizedBox(
                          height: 10,
                          width: 10,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.amber),
                          ),
                        )
                      : const Icon(Icons.cloud_upload_outlined, size: 14, color: Colors.amber),
                  label: Text(
                    '$unsyncedCount pending',
                    style: const TextStyle(fontSize: 10, color: Colors.amber, fontWeight: FontWeight.bold),
                  ),
                  backgroundColor: Colors.amber.withOpacity(0.1),
                  side: const BorderSide(color: Colors.amber, width: 0.5),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  onPressed: isSyncing
                      ? null
                      : () {
                          ref.read(syncProvider.notifier).syncLogs();
                        },
                ),
              ),
            ),
        ],
      ),
      body: Stack(
        children: [
          // Camera scanner view
          MobileScanner(
            controller: _cameraController,
            onDetect: (capture) {
              final barcodes = capture.barcodes;
              if (barcodes.isNotEmpty) {
                final code = barcodes.first.rawValue;
                if (code != null && code.isNotEmpty) {
                  _handleScan(code);
                }
              }
            },
          ),

          // Sliding Action Segment Switcher (In / Out)
          Positioned(
            top: 24,
            left: 24,
            right: 24,
            child: _isCrewMode
                ? Container(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.6),
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(color: Colors.white12),
                    ),
                    child: const Center(
                      child: Text(
                        'PENCATATAN KEHADIRAN CREW',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ),
                  )
                : Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.6),
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(color: Colors.white12),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                _scanAction = 'in';
                              });
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: _scanAction == 'in'
                                    ? const Color(0xFF08B4B5)
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(26),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.login,
                                    size: 16,
                                    color: _scanAction == 'in' ? Colors.white : Colors.white60,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Masuk (Check-In)',
                                    style: TextStyle(
                                      color: _scanAction == 'in' ? Colors.white : Colors.white60,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                _scanAction = 'out';
                              });
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: _scanAction == 'out'
                                    ? const Color(0xFFEF4444)
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(26),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.logout,
                                    size: 16,
                                    color: _scanAction == 'out' ? Colors.white : Colors.white60,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Keluar (Check-Out)',
                                    style: TextStyle(
                                      color: _scanAction == 'out' ? Colors.white : Colors.white60,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
          ),

          // Mode Selection Chips (Tickets vs Crew)
          Positioned(
            top: 88,
            left: 24,
            right: 24,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ChoiceChip(
                  label: const Text(
                    'Mode Tiket',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.white),
                  ),
                  selected: !_isCrewMode,
                  selectedColor: const Color(0xFF08B4B5),
                  backgroundColor: Colors.black.withOpacity(0.6),
                  onSelected: (selected) {
                    setState(() {
                      _isCrewMode = false;
                    });
                  },
                ),
                const SizedBox(width: 16),
                ChoiceChip(
                  label: const Text(
                    'Mode Crew',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.white),
                  ),
                  selected: _isCrewMode,
                  selectedColor: const Color(0xFF08B4B5),
                  backgroundColor: Colors.black.withOpacity(0.6),
                  onSelected: (selected) {
                    setState(() {
                      _isCrewMode = true;
                    });
                  },
                ),
              ],
            ),
          ),

          // Visual scanner target frame overlay
          Center(
            child: Container(
              height: 260,
              width: 260,
              decoration: BoxDecoration(
                border: Border.all(
                  color: _scanAction == 'out' ? const Color(0xFFEF4444) : const Color(0xFF08B4B5),
                  width: 2,
                ),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Stack(
                children: [
                  // Corners highlight accents
                  Positioned(
                    top: 10,
                    left: 10,
                    child: Container(width: 20, height: 2, color: Colors.white),
                  ),
                  Positioned(
                    top: 10,
                    left: 10,
                    child: Container(width: 2, height: 20, color: Colors.white),
                  ),
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(width: 20, height: 2, color: Colors.white),
                  ),
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(width: 2, height: 20, color: Colors.white),
                  ),
                  Positioned(
                    bottom: 10,
                    left: 10,
                    child: Container(width: 20, height: 2, color: Colors.white),
                  ),
                  Positioned(
                    bottom: 10,
                    left: 10,
                    child: Container(width: 2, height: 20, color: Colors.white),
                  ),
                  Positioned(
                    bottom: 10,
                    right: 10,
                    child: Container(width: 20, height: 2, color: Colors.white),
                  ),
                  Positioned(
                    bottom: 10,
                    right: 10,
                    child: Container(width: 2, height: 20, color: Colors.white),
                  ),
                ],
              ),
            ),
          ),

          // Floating controls row
          Positioned(
            bottom: 40,
            left: 24,
            right: 24,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                // Flashlight toggle
                _buildControlButton(
                  icon: Icons.flashlight_on_outlined,
                  onTap: () => _cameraController.toggleTorch(),
                ),

                // Manual Check-in / Check-out
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => ManualCheckinScreen(action: _scanAction),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _scanAction == 'out' ? const Color(0xFFEF4444) : const Color(0xFF08B4B5),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  icon: const Icon(Icons.keyboard_outlined, size: 20),
                  label: const Text(
                    'Input Manual',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                ),

                // Flip camera toggle
                _buildControlButton(
                  icon: Icons.flip_camera_ios_outlined,
                  onTap: () => _cameraController.switchCamera(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildControlButton({required IconData icon, required VoidCallback onTap}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.5),
        shape: BoxShape.circle,
      ),
      child: IconButton(
        icon: Icon(icon, color: Colors.white, size: 24),
        onPressed: onTap,
      ),
    );
  }
}
