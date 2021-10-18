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
// �˸�. ��� ���۱��� Vinnie Falco ���� �ֽ��ϴ�. 
// - �ش� �ڵ�� �н� �������� �ۼ�
// - �ּ��� �ѱ۷� �ۼ��� ������ �����ϱ� ���� �ۼ��߽��ϴ�.
// - �ּ��� Ʋ�� �κ��� ���� �� �ֽ��ϴ�.
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

// Ŭ���̾�Ʈ
// HTTP GET �����ϰ� ��� ���
#if 0
int main(int argc, char* argv[])
{
	try
	{
#ifdef DEBUG
		//  ��� �μ� Ȯ��
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
		// ��� ����¿��� io_context�� �ʿ�
		net::io_context ioc;

		// �Ʒ� ��ü�� �츮�� ������� ����
		tcp::resolver resolver{ ioc };
		tcp::socket socket{ ioc };

		// ������ ���� ã��
		auto const results = resolver.resolve(host, port);

		// ã�� IP �ּҿ� ����
		net::connect(socket, results.begin(), results.end());

		// HTTP GET ���� �޽��� ���
		http::request<http::string_body> req{ http::verb::get, target, version };
		req.set(http::field::host, host);
		req.set(http::field::user_agent, BOOST_BEAST_VERSION_STRING);

		// ���� ȣ��Ʈ�� HTTP ��û ����
		http::write(socket, req);

		// �б⿡ ���Ǵ� ����, �ݵ�� ���������� �����ž���
		beast::flat_buffer buffer;

		// ������ ���� �� �ִ� �����̳� ����
		http::response<http::dynamic_body> res;

		// HTTP ���� ����
		http::read(socket, buffer, res);

		// ǥ�� ��¿� �޽��� ����
		std::cout << res << "\n";

		// �Ƹ���� ���� ����
		beast::error_code ec;
		socket.shutdown(tcp::socket::shutdown_both, ec);

		// ���� ���� �ȵ� �߻�
		// �̸� �����ϴµ� �������� �ʵ���(?) Don't bother reporting it
		if (ec && ec != beast::errc::not_connected)
		{
			throw beast::system_error{ ec };
		}

		// ������� ������ �Ƹ���� ���� ��!

	}
	catch (std::exception const& e)
	{
		std::cerr << "Error: " << e.what() << "\n";
		return EXIT_FAILURE;
	}

	return EXIT_SUCCESS;
}
#endif