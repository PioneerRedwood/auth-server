// https://www.boost.org/doc/libs/develop/libs/beast/example/http/client/sync/http_client_sync.cpp
//
// Copyright (c) 2016-2019 Vinnie Falco (vinnie dot falco at gmail dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/beast
// 
// 2021-10-18 PioneerRedwood https://github.com/PioneerRedwood
// 알림. 모든 저작권은 Vinnie Falco 에게 있습니다. 
// - 해당 코드는 학습 차원에서 작성
// - 주석은 한글로 작성자 본인이 이해하기 쉽게 작성했습니다.
// - 주석이 틀린 부분이 있을 수 있습니다.
//


#include <boost/beast/core.hpp>
#include <boost/beast/http.hpp>
#include <boost/beast/version.hpp>
#include <boost/asio/connect.hpp>
#include <boost/asio/ip/tcp.hpp>
#include <cstdlib>
#include <iostream>
#include <string>

namespace beast = boost::beast;
namespace http = beast::http;
namespace net = boost::asio;
using tcp = net::ip::tcp;

// 클라이언트
// HTTP GET 수행하고 결과 출력
#if 0
int main(int argc, char* argv[])
{
	try
	{
#ifdef DEBUG
		//  명령 인수 확인
		if (argc != 4 && argc != 5)
		{
			std::cerr <<
				"Usage: http-client-sync <host> <target> [<HTTP verstion: 1.0 or 1.1(default)>\n" <<
				"Example:\n" <<
				"	http-client-sync www.example.com 80 /\n" <<
				"	http-client-sync www.example.com 80 / 1.0\n";
			return EXIT_FAILURE;
		}

		auto const host = argv[1];
		auto const port = argv[2];
		auto const target = argv[3];
		int version = argc == 5 && !std::strcmp("1.0", argv[4]) ? 10 : 11;
#else
		auto const host = "localhost";
		auto const port = "8081";
		auto const target = "/auth";
		int version =  11;
#endif
		// 모든 입출력에는 io_context가 필요
		net::io_context ioc;

		// 아래 객체는 우리의 입출력을 수행
		tcp::resolver resolver{ ioc };
		tcp::socket socket{ ioc };

		// 도메인 네임 찾기
		auto const results = resolver.resolve(host, port);

		// 찾은 IP 주소와 연결
		net::connect(socket, results.begin(), results.end());

		// HTTP GET 응답 메시지 등록
		http::request<http::string_body> req{ http::verb::get, target, version };
		req.set(http::field::host, host);
		req.set(http::field::user_agent, BOOST_BEAST_VERSION_STRING);

		// 원격 호스트에 HTTP 요청 전송
		http::write(socket, req);

		// 읽기에 사용되는 버퍼, 반드시 영구적으로 유지돼야함
		beast::flat_buffer buffer;

		// 응답을 받을 수 있는 컨테이너 선언
		http::response<http::dynamic_body> res;

		// HTTP 응답 수신
		http::read(socket, buffer, res);

		// 표준 출력에 메시지 쓰기
		std::cout << res << "\n";

		// 아름답게 소켓 종료
		beast::error_code ec;
		socket.shutdown(tcp::socket::shutdown_both, ec);

		// 종종 연결 안됨 발생
		// 이를 보고하는데 괴롭히지 않도록(?) Don't bother reporting it
		if (ec && ec != beast::errc::not_connected)
		{
			throw beast::system_error{ ec };
		}

		// 여기까지 왔으면 아름답게 닫힌 것!

	}
	catch (std::exception const& e)
	{
		std::cerr << "Error: " << e.what() << "\n";
		return EXIT_FAILURE;
	}

	return EXIT_SUCCESS;
}
#endif