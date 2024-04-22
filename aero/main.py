import asyncio
import logging
from lxml import etree

import grpc
import aero_pb2
import aero_pb2_grpc

# Coroutines to be invoked when the event loop is shutting down.
_cleanup_coroutines = []


class AeroService(aero_pb2_grpc.AeroServicer):
    async def ParseHTML(
        self,
        request: aero_pb2.ParseHTMLRequest,
        context: grpc.aio.ServicerContext,
    ) -> aero_pb2.ParseHTMLResult:
        logging.info("Received request, parsing HTML")
        tree = etree.HTML(request.html)
        fragments = [
            aero_pb2.HTMLFragment(
                selector=selector,
                selector_type=request.selector_type,
                content=tree.xpath(selector)[0].text if tree.xpath(selector) else "", 
            )
            for selector in request.selectors
        ]

        return aero_pb2.ParseHTMLResult(fragments=fragments)


async def serve() -> None:
    server = grpc.aio.server()
    aero_pb2_grpc.add_AeroServicer_to_server(AeroService(), server)
    listen_addr = "[::]:50051"
    server.add_insecure_port(listen_addr)
    logging.info("Starting server on %s", listen_addr)
    await server.start()

    async def server_graceful_shutdown():
        logging.info("Starting graceful shutdown...")
        # Shuts down the server with 5 seconds of grace period. During the
        # grace period, the server won't accept new connections and allow
        # existing RPCs to continue within the grace period.
        await server.stop(5)

    _cleanup_coroutines.append(server_graceful_shutdown())
    await server.wait_for_termination()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(serve())
    finally:
        loop.run_until_complete(*_cleanup_coroutines)
        loop.close()
