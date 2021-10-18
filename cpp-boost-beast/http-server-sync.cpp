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
// 알림. 모든 저작권은 Vinnie Falco 에 있습니다. 
// - 해당 코드는 학습 차원에서 작성
// - 주석은 한글로 작성자 본인이 이해하기 쉽게 작성했습니다.
// - 주석이 틀린 부분이 있을 수 있습니다.
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
// 확장자 파일을 기반으로 한 적절한 MIME 유형 반환
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

// HTTP 상대 경로에 로컬 파일시스템 경로 확장
// 반환되는 경로는 플랫폼에 따라 정규화됨
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

// 주어진 요청에 따라 HTTP 응답을 생산하는 함수
// 응답 객체는 요청하는 컨텐츠에 의존
// 인터페이스는 응답을 받기 위한 일반 람다를 전달하는 호출자
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

	// 해당 입력을 처리할 수 있음을 분명히 할 것. Make sure we can handle the method
	if (req.method() != http::verb::get &&
		req.method() != http::verb::head &&
		req.method() != http::verb::post)
		return send(bad_request("Unknown HTTP-method"));

	// 요청 경로는 반드시 절대 경로이어야 하며 ".."를 포함하지 않아야 한다
	if (req.target().empty() ||
		req.target()[0] != '/' ||
		req.target().find("..") != beast::string_view::npos)
		return send(bad_request("ILLegal request-target"));

	// 요청한 파일에 대한 경로 만들기
	std::string path = path_cat(doc_root, req.target());
	if (req.target().back() == '/')
		path.append("index.html");

//#define FILEOUT
#ifdef FILE_OUT
	// 파일 열기 시도
	beast::error_code ec;
	http::file_body::value_type body;
	body.open(path.c_str(), beast::file_mode::scan, ec);

	// 파일이 존재하지 않은 경우 처리
	if (ec == beast::errc::no_such_file_or_directory)
		return send(not_found(req.target()));
#else
	// 파일이 아니라 DB 처리를 해야 함
	http::string_body::value_type body;

	if (path.find("auth"))
	{
		body.append("http-server-sync REDWOOD response");
	}
#endif
	// 알 수 없는 에러 처리
	//if (ec)
	//	return send(server_error(ec.message()));

	// 다음으로 이동 시 필요한 크기 캐싱
	auto const size = body.size();

	// HEAD 요청에 대한 응답
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
	// GET 요청에 응답
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

// 실패 보고
void
fail(beast::error_code ec, char const* what)
{
	std::cerr << what << ": " << ec.message() << "\n";
}

// C++ 일반 람다
// 함수 객체는 HTTP 응답을 송신하기 위해 사용됨
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
		// 후에 연결을 종료해야하는지 결정
		close_ = msg.need_eof();

		// 여기서 Serializer가 필요, Serializer는 비정적 file_body 객체를 요구
		// 메시지의 http::write는 정적 객체에서만 작동(?)
		http::serializer<isRequest, Body, Fields> sr{ msg };
		http::write(stream_, sr, ec_);
	}
};

// HTTP 서버 연결 처리
void
do_session(
	tcp::socket& socket,
	std::shared_ptr<std::string const> const& doc_root)
{
	bool close = false;
	beast::error_code ec;

	// 읽기 작업의 전반적인 작업에서 반드시 유지되어야 하는 버퍼
	beast::flat_buffer buffer;

	// 전송 메시지 사용시 필요한 람다
	send_lambda<tcp::socket> lambda{ socket, close, ec };

	for (;;)
	{
		// 요청 읽기
		http::request<http::string_body> req;
		http::read(socket, buffer, req, ec);
		if (ec == http::error::end_of_stream)
			break;
		if (ec)
			return fail(ec, "read");

		// 응답 전송
		handle_request(*doc_root, std::move(req), lambda);
		if (ec)
			return fail(ec, "write");
		if (close)
		{
			// 연결을 종료해야함을 의미
			// 종종 응답은 연결이 종료되는 체계를 의미(?)
			break;
		}
	}

	// TCP 종료 전송
	socket.shutdown(tcp::socket::shutdown_send, ec);

	// 여기까지 왔다면 아름답게 연결이 종료된 것
}


int main(int argc, char* argv[])
{
	try
	{
//#define DEBUG 0
#ifdef DEBUG
		// 명령 인수 확인
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
		// . 으로 줬었음 -> /auth/
		auto const doc_root = std::make_shared<std::string>(".auth/");
#endif
		// 모든 입출력에는 io_context가 필요
		net::io_context ioc{ 1 };

		// acceptor로 들어오는 연결 수신 
		tcp::acceptor acceptor{ ioc, {address, port} };
		for (;;)
		{
			// 새로운 연결 수신
			tcp::socket socket{ ioc };

			// 연결이 성공될 때까지 블록 상태
			acceptor.accept(socket);

			// 세션 실행, 소켓의 소유권 양도
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