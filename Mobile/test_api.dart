import 'package:dio/dio.dart';

void main() async {
  final dio = Dio(BaseOptions(
    baseUrl: 'http://127.0.0.1:5001/api/',
    responseType: ResponseType.json,
  ));

  try {
    print('Fetching layanan...');
    final response = await dio.get('/layanan');
    print('Layanan Type: \${response.data.runtimeType}');
    print('Layanan Data: \${response.data}');
    
    print('Fetching kategori...');
    final catResponse = await dio.get('/kategori-kendaraan');
    print('Kategori Type: \${catResponse.data.runtimeType}');
    print('Kategori Data: \${catResponse.data}');
  } catch (e) {
    print('Error: \$e');
  }
}
