import 'dart:io' show Platform;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart' as mobile;
import 'package:webview_windows/webview_windows.dart' as desktop;

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // Set status bar styles for mobile
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
  ));
  runApp(const HydraWalkApp());
}

class HydraWalkApp extends StatelessWidget {
  const HydraWalkApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'HydraWalk',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F172A), // Slate 900
      ),
      home: const WebViewContainer(),
    );
  }
}

class WebViewContainer extends StatefulWidget {
  const WebViewContainer({super.key});

  @override
  State<WebViewContainer> createState() => _WebViewContainerState();
}

class _WebViewContainerState extends State<WebViewContainer> {
  // Mobile Controller
  mobile.WebViewController? _mobileController;
  
  // Desktop Controller
  final _desktopController = desktop.WebviewController();
  
  bool _isLoading = true;
  bool _isWindows = false;
  String _loadingProgress = "0%";
  final String _appUrl = "https://hydrawalk.vercel.app";

  @override
  void initState() {
    super.initState();
    _isWindows = Platform.isWindows;
    if (_isWindows) {
      _initWindowsWebView();
    } else {
      _initMobileWebView();
    }
  }

  Future<void> _initWindowsWebView() async {
    try {
      await _desktopController.initialize();
      await _desktopController.setBackgroundColor(const Color(0xFF0F172A));
      await _desktopController.loadUrl(_appUrl);
      
      _desktopController.loadingState.listen((state) {
        if (state == desktop.LoadingState.navigationCompleted) {
          setState(() {
            _isLoading = false;
          });
        }
      });
    } catch (e) {
      debugPrint("Windows WebView failed to initialize: $e");
    }
  }

  void _initMobileWebView() {
    _mobileController = mobile.WebViewController()
      ..setJavaScriptMode(mobile.JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF0F172A))
      ..setNavigationDelegate(
        mobile.NavigationDelegate(
          onProgress: (int progress) {
            setState(() {
              _loadingProgress = "$progress%";
            });
          },
          onPageStarted: (String url) {
            setState(() {
              _isLoading = true;
            });
          },
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });
          },
          onWebResourceError: (mobile.WebResourceError error) {
            debugPrint("Mobile WebView error: ${error.description}");
          },
        ),
      )
      ..loadRequest(Uri.parse(_appUrl));
  }

  @override
  void dispose() {
    if (_isWindows) {
      _desktopController.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    Widget webViewWidget;

    if (_isWindows) {
      webViewWidget = _desktopController.value.isInitialized
          ? desktop.Webview(_desktopController)
          : const Center(
              child: Text(
                "Initializing Windows graphics...",
                style: TextStyle(color: Colors.white70),
              ),
            );
    } else {
      webViewWidget = mobile.WebViewWidget(controller: _mobileController!);
    }

    return Scaffold(
      body: SafeArea(
        top: !_isWindows, // Allow full bleed on Windows, safe area on mobile
        bottom: false,
        child: Stack(
          children: [
            webViewWidget,
            if (_isLoading)
              Container(
                color: const Color(0xFF0F172A),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Hydration Icon Glow
                      Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const LinearGradient(
                            colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF3B82F6).withOpacity(0.4),
                              blurRadius: 24,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Text(
                            "💧",
                            style: TextStyle(fontSize: 36),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        "HydraWalk",
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          letterSpacing: 0.8,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _isWindows ? "Loading desktop view..." : "Loading $_loadingProgress",
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.white54,
                          fontWeight: FontWeight.w500,
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
