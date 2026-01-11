import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';

// --- Theme Colors (Approximation of Tailwind classes) ---
class AppColors {
  static const primary600 = Color(0xFF7C3AED); // Violet-600
  static const primary700 = Color(0xFF6D28D9);
  
  static const gray50 = Color(0xFFF9FAFB);
  static const gray100 = Color(0xFFF3F4F6);
  static const gray200 = Color(0xFFE5E7EB);
  static const gray400 = Color(0xFF9CA3AF);
  static const gray500 = Color(0xFF6B7280);
  static const gray600 = Color(0xFF4B5563);
  static const gray700 = Color(0xFF374151);
  static const gray800 = Color(0xFF1F2937);
  static const gray900 = Color(0xFF111827);

  static const darkBg = Color(0xFF0F172A); // Slate-900 (approx)
  static const darkCard = Color(0xFF1E293B); // Slate-800
}

enum ButtonVariant { primary, secondary, danger, ghost, outline }

class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final ButtonVariant variant;
  final bool isLoading;
  final IconData? icon;
  final bool fullWidth;

  const CustomButton({
    super.key,
    required this.text,
    this.onPressed,
    this.variant = ButtonVariant.primary,
    this.isLoading = false,
    this.icon,
    this.fullWidth = false,
  });

  @override
  Widget build(BuildContext context) {
    Color bgColor;
    Color textColor;
    BorderSide borderSide = BorderSide.none;

    final isDark = Theme.of(context).brightness == Brightness.dark;

    switch (variant) {
      case ButtonVariant.primary:
        bgColor = AppColors.primary600;
        textColor = Colors.white;
        break;
      case ButtonVariant.secondary:
        bgColor = isDark ? AppColors.gray700 : AppColors.gray200;
        textColor = isDark ? Colors.white : AppColors.gray900;
        break;
      case ButtonVariant.danger:
        bgColor = Colors.red;
        textColor = Colors.white;
        break;
      case ButtonVariant.ghost:
        bgColor = Colors.transparent;
        textColor = isDark ? AppColors.gray400 : AppColors.gray600;
        break;
      case ButtonVariant.outline:
        bgColor = Colors.transparent;
        textColor = isDark ? AppColors.gray400 : AppColors.gray700;
        borderSide = BorderSide(color: isDark ? AppColors.gray700 : AppColors.gray200, width: 2);
        break;
    }

    final buttonStyle = ElevatedButton.styleFrom(
      backgroundColor: bgColor,
      foregroundColor: textColor,
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: variant == ButtonVariant.primary ? 4 : 0,
      side: borderSide,
    );

    Widget content = isLoading
        ? const SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[Icon(icon, size: 20), const SizedBox(width: 8)],
              Text(text, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
            ],
          );

    if (fullWidth) {
      return SizedBox(width: double.infinity, child: ElevatedButton(style: buttonStyle, onPressed: onPressed, child: content));
    }
    return ElevatedButton(style: buttonStyle, onPressed: onPressed, child: content);
  }
}

class IronLogCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;

  const IronLogCard({
    super.key,
    required this.child,
    this.padding,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: padding ?? const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(16),
          // Slight border instead of shadow for cleaner look in Flutter
          border: Border.all(color: isDark ? AppColors.gray800 : AppColors.gray100),
          boxShadow: isDark
              ? []
              : [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
        ),
        child: child,
      ),
    );
  }
}

class IronLogInput extends StatelessWidget {
  final String label;
  final String placeholder;
  final TextEditingController? controller;
  final bool obscureText;
  final TextInputType keyboardType;
  final ValueChanged<String>? onChanged;

  const IronLogInput({
    super.key,
    required this.label,
    this.placeholder = '',
    this.controller,
    this.obscureText = false,
    this.keyboardType = TextInputType.text,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
            color: isDark ? AppColors.gray400 : AppColors.gray500,
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          onChanged: onChanged,
          style: TextStyle(color: isDark ? Colors.white : AppColors.gray900),
          decoration: InputDecoration(
            hintText: placeholder,
            hintStyle: TextStyle(color: isDark ? AppColors.gray600 : AppColors.gray400),
            filled: true,
            fillColor: isDark ? AppColors.gray800 : AppColors.gray50,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: isDark ? AppColors.gray700 : AppColors.gray200),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: isDark ? AppColors.gray700 : AppColors.gray200),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.primary600, width: 2),
            ),
          ),
        ),
      ],
    );
  }
}
class SwipeToStart extends StatefulWidget {
  final VoidCallback onSwipe;
  final String text;

  const SwipeToStart({
    super.key,
    required this.onSwipe,
    this.text = "SWIPE TO START",
  });

  @override
  State<SwipeToStart> createState() => _SwipeToStartState();
}

class _SwipeToStartState extends State<SwipeToStart> with TickerProviderStateMixin {
  double _dragValue = 0.0;
  bool _isFinished = false;
  late AnimationController _pulseController;
  late AnimationController _nudgeController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();

    _nudgeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _nudgeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return LayoutBuilder(
      builder: (context, constraints) {
        final double maxWidth = constraints.maxWidth;
        final double handleWidth = 64.0;
        final double maxDragX = maxWidth - handleWidth - 8;
        final double progress = _dragValue / maxDragX;

        return Container(
          height: 68,
          width: double.infinity,
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF0F172A).withOpacity(0.6) : Colors.black.withOpacity(0.05),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withOpacity(0.05)),
          ),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              // Persistent Background Speed Lines
              Positioned.fill(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: AnimatedBuilder(
                    animation: _pulseController,
                    builder: (context, child) {
                      return CustomPaint(
                        painter: _BackgroundSpeedPainter(
                          _pulseController.value,
                          isSwiping: _dragValue > 0,
                        ),
                      );
                    },
                  ),
                ),
              ),

              // Shimmering / Background Text
              Center(
                child: Stack(
                  children: [
                    Text(
                      widget.text,
                      style: TextStyle(
                        color: isDark ? Colors.white10 : Colors.black12,
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2.0,
                      ),
                    ),
                    ClipRect(
                      clipper: _ProgressClipper(progress: progress),
                      child: AnimatedBuilder(
                        animation: _pulseController,
                        builder: (context, child) {
                          return Text(
                            widget.text,
                            style: TextStyle(
                              color: isDark ? Colors.white.withOpacity(0.4 + 0.2 * _pulseController.value) : AppColors.primary600,
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 2.0,
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),

              // Progress Bar Shadow/Glow
              Positioned(
                left: 0,
                top: 0,
                bottom: 0,
                child: Container(
                  width: _dragValue + handleWidth / 2,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppColors.primary600.withOpacity(0.35),
                        AppColors.primary600.withOpacity(0.0),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
              ),

              // Draggable Handle
              AnimatedBuilder(
                animation: _nudgeController,
                builder: (context, child) {
                  double leftPos = _dragValue + 4;
                  if (_dragValue == 0) {
                    leftPos += _nudgeController.value * 14; // Idle nudge
                  }
                  
                  return AnimatedPositioned(
                    duration: Duration(milliseconds: _isFinished ? 0 : 75),
                    left: leftPos,
                    top: 4,
                    bottom: 4,
                    child: GestureDetector(
                      onHorizontalDragUpdate: (details) {
                        setState(() {
                          _dragValue += details.delta.dx;
                          if (_dragValue < 0) _dragValue = 0;
                          if (_dragValue > maxDragX) _dragValue = maxDragX;
                        });

                        if (_dragValue >= maxDragX * 0.98 && !_isFinished) {
                          _isFinished = true;
                          widget.onSwipe();
                        }
                      },
                      onHorizontalDragEnd: (details) {
                        if (!_isFinished) {
                          setState(() {
                            _dragValue = 0;
                          });
                        }
                      },
                      child: Container(
                        width: handleWidth,
                        decoration: BoxDecoration(
                          color: AppColors.primary600,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary600.withOpacity(0.4),
                              blurRadius: 12,
                              spreadRadius: 2,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.chevron_right, color: Colors.white, size: 24),
                                SizedBox(width: -8),
                                Icon(Icons.chevron_right, color: Colors.white54, size: 24),
                              ],
                            ),
                            if (_dragValue > 0)
                              Positioned.fill(
                                child: CircularProgressIndicator(
                                  value: progress,
                                  strokeWidth: 2,
                                  backgroundColor: Colors.white10,
                                  valueColor: const AlwaysStoppedAnimation<Color>(Colors.white30),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ProgressClipper extends CustomClipper<Rect> {
  final double progress;
  _ProgressClipper({required this.progress});

  @override
  Rect getClip(Size size) {
    return Rect.fromLTWH(0, 0, size.width * progress, size.height);
  }

  @override
  bool shouldReclip(_ProgressClipper oldClipper) => progress != oldClipper.progress;
}

class _BackgroundSpeedPainter extends CustomPainter {
  final double animationValue;
  final bool isSwiping;
  final List<double> _randomTops = List.generate(25, (_) => math.Random().nextDouble());
  final List<double> _randomDelays = List.generate(25, (_) => math.Random().nextDouble());

  _BackgroundSpeedPainter(this.animationValue, {required this.isSwiping});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..strokeWidth = 1.0
      ..strokeCap = StrokeCap.round;

    double velocity = isSwiping ? 8.0 : 2.0;
    
    for (int i = 0; i < 25; i++) {
        // Calculate horizontal progress with offset per particle
        double progress = ( (animationValue * velocity) + _randomDelays[i] ) % 1.0;
        
        // Motion Blur: Stretch lines more when swiping
        double length = isSwiping ? (40.0 + progress * 80.0) : (15.0 + progress * 25.0);
        
        double xStart = progress * (size.width + 200) - 100;
        double xEnd = xStart + length;
        double y = _randomTops[i] * size.height;

        // Dynamic Opacity (Faint in, sharp middle, faint out)
        double opacity = 0.0;
        if (progress < 0.2) opacity = (progress / 0.2) * 0.4;
        else if (progress > 0.8) opacity = ((1.0 - progress) / 0.2) * 0.4;
        else opacity = 0.4;

        paint.shader = ui.Gradient.linear(
          Offset(xStart, y),
          Offset(xEnd, y),
          [Colors.white.withOpacity(0), Colors.white.withOpacity(opacity.clamp(0.0, 1.0))],
        );

        canvas.drawLine(
          Offset(xStart, y),
          Offset(xEnd, y),
          paint,
        );
    }
  }

  @override
  bool shouldRepaint(_BackgroundSpeedPainter oldDelegate) => true;
}
