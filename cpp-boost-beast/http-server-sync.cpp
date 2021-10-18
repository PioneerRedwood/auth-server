// https://www.boost.org/doc/libs/develop/libs/beast/example/http/server/sync/http_server_sync.cpp
//
// Copyright (c) 2016-2019 Vinnie Falco (vinnie dot falco at gmail dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/beast
// 
// 2021-10-18 PioneerRedwood https://github.com/PioneerRedwood
// �˸�. ��� ���۱��� Vinnie Falco �� �ֽ��ϴ�. 
// - �ش� �ڵ�� �н� �������� �ۼ�
// - �ּ��� �ѱ۷� �ۼ��� ������ �����ϱ� ���� �ۼ��߽��ϴ�.
// - �ּ��� Ʋ�� �κ��� ���� �� �ֽ��ϴ�.
//

#include <boost/beast/core.hpp>
#include <boost/beast/http.hpp>
#include <boost/beast/version.hpp>
#include <boost/asio/ip/tcp.hpp>
#include <boost/config.hpp>
#include <cstdlib>
#include <iostream>
#include <memory>
#include <string>
#include <thread>

namespace beast = boost::beast;
namespace http = beast::http;
namespace net = boost::asio;
using tcp = net::ip::tcp;
#if 1
// Ȯ���� ������ ������� �� ������ MIME ���� ��ȯ
beast::string_view
mime_type(beast::string_view path)
{
	using beast::iequals;
	auto const ext = [&path]()
	{
		auto const pos = path.rfind(".");
		if (pos == beast::string_view::npos)
		{
			return beast::string_view{};
		}
		auto str = path.substr(pos);
		return str;
	}();

	if (iequals(ext, ".htm")) return "text/html";
	if (iequals(ext, ".html")) return "text/html";
	if (iequals(ext, ".php"))  return "text/html";
	if (iequals(ext, ".css"))  return "text/css";
	if (iequals(ext, ".txt"))  return "text/plain";
	if (iequals(ext, ".js"))   return "application/javascript";
	if (iequals(ext, ".json")) return "application/json";
	if (iequals(ext, ".xml"))  return "application/xml";
	if (iequals(ext, ".swf"))  return "application/x-shockwave-flash";
	if (iequals(ext, ".flv"))  return "video/x-flv";
	if (iequals(ext, ".png"))  return "image/png";
	if (iequals(ext, ".jpe"))  return "image/jpeg";
	if (iequals(ext, ".jpeg")) return "image/jpeg";
	if (iequals(ext, ".jpg"))  return "image/jpeg";
	if (iequals(ext, ".gif"))  return "image/gif";
	if (iequals(ext, ".bmp"))  return "image/bmp";
	if (iequals(ext, ".ico"))  return "image/vnd.microsoft.icon";
	if (iequals(ext, ".tiff")) return "image/tiff";
	if (iequals(ext, ".tif"))  return "image/tiff";
	if (iequals(ext, ".svg"))  return "image/svg+xml";
	if (iequals(ext, ".svgz")) return "image/svg+xml";
	return "application/text";
}

// HTTP ��� ��ο� ���� ���Ͻý��� ��� Ȯ��
// ��ȯ�Ǵ� ��δ� �÷����� ���� ����ȭ��
std::string
path_cat(
	beast::string_view base,
	beast::string_view path)
{
	if (base.empty())
		return std::string(path);
	std::string result(base);
#ifdef BOOST_MSVC
	char constexpr path_seperator = '\\';
	if (result.back() == path_seperator)
		result.resize(result.size() - 1);
	result.append(path.data(), path.size());
	for (auto& c : result)
	{
		if (c == '/')
			c = path_seperator;
	}
#else
	char constexpr path_seperator = '/';
	if (result.back() == path_seperator)
		result.resize(result.size() - 1);
	result.append(path.data(), path.size());
#endif
	return result;
}

// �־��� ��û�� ���� HTTP ������ �����ϴ� �Լ�
// ���� ��ü�� ��û�ϴ� �������� ����
// �������̽��� ������ �ޱ� ���� �Ϲ� ���ٸ� �����ϴ� ȣ����
template<
	class Body, class Allocator,
	class Send>
	void
	handle_request(
		beast::string_view doc_root,
		http::request<Body, http::basic_fields<Allocator>>&& req,
		Send&& send)
{
	// Returns a bad request response 400
	auto const bad_request =
		[&req](beast::string_view why)
	{
		http::response<http::string_body> res{ http::status::bad_request, req.version() };
		res.set(http::field::server, BOOST_BEAST_VERSION_STRING);
		res.set(http::field::content_type, "text/html");
		res.keep_alive(req.keep_alive());
		res.body() = std::string(why);
		res.prepare_payload();
		return res;
	};

	// Returns a not found response 404
	auto const not_found =
		[&req](beast::string_view target)
	{
		http::response<http::string_body> res{ http::status::not_found, req.version() };
		res.set(http::field::server, BOOST_BEAST_VERSION_STRING);
		res.set(http::field::content_type, "text/html");
		res.keep_alive(req.keep_alive());
		res.body() = "The resource '" + std::string(target) + "' was not found.";
		res.prepare_payload();
		return res;
	};

	// Returns a server error response 500
	auto const server_error =
		[&req](beast::string_view what)
	{
		http::response<http::string_body> res{ http::status::internal_server_error, req.version() };
		res.set(http::field::server, BOOST_BEAST_VERSION_STRING);
		res.set(http::field::content_type, "text/html");
		res.keep_alive(req.keep_alive());
		res.body() = "An error occured: '" + std::string(what) + "'";
		res.prepare_payload();
		return res;
	};

	// �ش� �Է��� ó���� �� ������ �и��� �� ��. Make sure we can handle the method
	if (req.method() != http::verb::get &&
		req.method() != http::verb::head &&
		req.method() != http::verb::post)
		return send(bad_request("Unknown HTTP-method"));

	// ��û ��δ� �ݵ�� ���� ����̾�� �ϸ� ".."�� �������� �ʾƾ� �Ѵ�
	if (req.target().empty() ||
		req.target()[0] != '/' ||
		req.target().find("..") != beast::string_view::npos)
		return send(bad_request("ILLegal request-target"));

	// ��û�� ���Ͽ� ���� ��� �����
	std::string path = path_cat(doc_root, req.target());
	if (req.target().back() == '/')
		path.append("index.html");

//#define FILEOUT
#ifdef FILE_OUT
	// ���� ���� �õ�
	beast::error_code ec;
	http::file_body::value_type body;
	body.open(path.c_str(), beast::file_mode::scan, ec);

	// ������ �������� ���� ��� ó��
	if (ec == beast::errc::no_such_file_or_directory)
		return send(not_found(req.target()));
#else
	// ������ �ƴ϶� DB ó���� �ؾ� ��
	http::string_body::value_type body;

	if (path.find("auth"))
	{
		body.append("http-server-sync REDWOOD response");
	}
#endif
	// �� �� ���� ���� ó��
	//if (ec)
	//	return send(server_error(ec.message()));

	// �������� �̵� �� �ʿ��� ũ�� ĳ��
	auto const size = body.size();

	// HEAD ��û�� ���� ����
	if (req.method() == http::verb::head)
	{
		http::response<http::empty_body> res{ http::status::ok, req.version() };
		res.set(http::field::server, BOOST_BEAST_VERSION_STRING);
		res.set(http::field::content_type, mime_type(path));
		res.content_length(size);
		res.keep_alive(req.keep_alive());
		std::cout << "SERVER GET METHOD RESPONSE STRING\n" << res << "\n";
		return send(std::move(res));
	}
	// GET ��û�� ����
	else if (req.method() == http::verb::get)
	{
#ifdef FILE_OUT
		http::response<http::file_body> res{
			std::piecewise_construct,
			std::make_tuple(std::move(body)),
			std::make_tuple(http::status::ok, req.version()) };
		res.set(http::field::server, BOOST_BEAST_VERSION_STRING);
		res.set(http::field::content_type, mime_type(path));
#else
		http::response<http::string_body> res{
			std::piecewise_construct,
			std::make_tuple(std::move(body)),
			std::make_tuple(http::status::ok, req.version()) };
		res.set(http::field::content_type, mime_type(path));
#endif
		res.content_length(size);
		res.keep_alive(req.keep_alive());
		std::cout << "SERVER GET METHOD RESPONSE STRING\n" << res << "\n";
		return send(std::move(res));
	}
}

// ���� ����
void
fail(beast::error_code ec, char const* what)
{
	std::cerr << what << ": " << ec.message() << "\n";
}

// C++ �Ϲ� ����
// �Լ� ��ü�� HTTP ������ �۽��ϱ� ���� ����
template<class Stream>
struct send_lambda
{
	Stream& stream_;
	bool& close_;
	beast::error_code& ec_;

	explicit
	send_lambda(
		Stream& stream,
		bool& close,
		beast::error_code& ec)
		: stream_(stream)
		, close_(close)
		, ec_(ec) {}

	template<bool isRequest, class Body, class Fields>
	void
		operator()(http::message<isRequest, Body, Fields>&& msg) const
	{
		// �Ŀ� ������ �����ؾ��ϴ��� ����
		close_ = msg.need_eof();

		// ���⼭ Serializer�� �ʿ�, Serializer�� ������ file_body ��ü�� �䱸
		// �޽����� http::write�� ���� ��ü������ �۵�(?)
		http::serializer<isRequest, Body, Fields> sr{ msg };
		http::write(stream_, sr, ec_);
	}
};

// HTTP ���� ���� ó��
void
do_session(
	tcp::socket& socket,
	std::shared_ptr<std::string const> const& doc_root)
{
	bool close = false;
	beast::error_code ec;

	// �б� �۾��� �������� �۾����� �ݵ�� �����Ǿ�� �ϴ� ����
	beast::flat_buffer buffer;

	// ���� �޽��� ���� �ʿ��� ����
	send_lambda<tcp::socket> lambda{ socket, close, ec };

	for (;;)
	{
		// ��û �б�
		http::request<http::string_body> req;
		http::read(socket, buffer, req, ec);
		if (ec == http::error::end_of_stream)
			break;
		if (ec)
			return fail(ec, "read");

		// ���� ����
		handle_request(*doc_root, std::move(req), lambda);
		if (ec)
			return fail(ec, "write");
		if (close)
		{
			// ������ �����ؾ����� �ǹ�
			// ���� ������ ������ ����Ǵ� ü�踦 �ǹ�(?)
			break;
		}
	}

	// TCP ���� ����
	socket.shutdown(tcp::socket::shutdown_send, ec);

	// ������� �Դٸ� �Ƹ���� ������ ����� ��
}


int main(int argc, char* argv[])
{
	try
	{
//#define DEBUG 0
#ifdef DEBUG
		// ��� �μ� Ȯ��
		if (argc != 4)
		{
			std::cerr <<
				"Usage: http-server-sync <address> <port> <doc_root>\n" <<
				"Example:\n" <<
				"	http-server-sync 0.0.0.0 8080 .\n";
			return EXIT_FAILURE;
		}

		auto const address = net::ip::make_address(argv[1]);
		auto const port = static_cast<unsigned short>(std::atoi(argv[2]));
		auto const doc_root = std::make_shared<std::string>(argv[3]);
#else
		auto const address = net::ip::make_address("127.0.0.1");
		auto const port = static_cast<unsigned short>(8081);
		// . ���� ����� -> /auth/
		auto const doc_root = std::make_shared<std::string>(".auth/");
#endif
		// ��� ����¿��� io_context�� �ʿ�
		net::io_context ioc{ 1 };

		// acceptor�� ������ ���� ���� 
		tcp::acceptor acceptor{ ioc, {address, port} };
		for (;;)
		{
			// ���ο� ���� ����
			tcp::socket socket{ ioc };

			// ������ ������ ������ ��� ����
			acceptor.accept(socket);

			// ���� ����, ������ ������ �絵
			std::thread{ std::bind(
				&do_session,
				std::move(socket),
				doc_root) }.detach();
		}
	}
	catch (const std::exception& e)
	{
		std::cerr << "Error: " << e.what() << "\n";
		return EXIT_FAILURE;
	}
	return EXIT_SUCCESS;
}
#endif