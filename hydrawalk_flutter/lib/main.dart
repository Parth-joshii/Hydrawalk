import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
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
        scaffoldBackgroundColor: const Color(0xFF0F172A),
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
  bool _isLoading = true;
  double _loadingProgress = 0;
  final String _appUrl = "https://hydrawalk.vercel.app";

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        top: false,
        bottom: false,
        child: Stack(
          children: [
            InAppWebView(
              initialUrlRequest: URLRequest(url: WebUri(_appUrl)),
              initialSettings: InAppWebViewSettings(
                javaScriptEnabled: true,
                domStorageEnabled: true,
                useWideViewPort: true,
                loadWithOverviewMode: true,
                transparentBackground: true,
              ),
              onProgressChanged: (controller, progress) {
                setState(() {
                  _loadingProgress = progress / 100;
                  if (progress >= 100) {
                    _isLoading = false;
                  }
                });
              },
              onLoadStart: (controller, url) {
                setState(() {
                  _isLoading = true;
                });
              },
              onLoadStop: (controller, url) {
                setState(() {
                  _isLoading = false;
                });
              },
            ),
            if (_isLoading)
              Container(
                color: const Color(0xFF0F172A),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
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
                        "Loading ${(_loadingProgress * 100).toInt()}%",
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
