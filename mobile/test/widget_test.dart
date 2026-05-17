import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';
import 'package:mobile/providers/auth_provider.dart';
import 'package:mobile/routes/app_router.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    final authProvider = AuthProvider();
    final router = AppRouter(authProvider).router;
    await tester.pumpWidget(AntrianBengkelApp(appRouter: router));
    await tester.pump();
    expect(find.byType(AntrianBengkelApp), findsOneWidget);
  });
}
