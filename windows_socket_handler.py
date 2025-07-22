# -*- coding: utf-8 -*-
"""Windows socket error handler for OAuth service"""

import socketserver
import sys

class SilentTCPServer(socketserver.TCPServer):
    """TCP Server that suppresses Windows socket errors"""
    
    def handle_error(self, request, client_address):
        """Override to suppress connection abort errors on Windows"""
        exc_type, exc_value, exc_traceback = sys.exc_info()
        
        # Check for Windows connection abort error
        if exc_type == ConnectionAbortedError:
            # Silently ignore - this is expected when browser closes connection
            pass
        elif hasattr(exc_value, 'errno') and exc_value.errno in [10053, 10054]:
            # Windows specific error codes:
            # 10053: Software caused connection abort
            # 10054: Connection reset by peer
            pass
        else:
            # For other errors, use default handling
            super().handle_error(request, client_address)


class QuietHTTPRequestHandler(socketserver.BaseRequestHandler):
    """Request handler that suppresses connection errors"""
    
    def handle(self):
        """Handle with error suppression"""
        try:
            # Call the actual handler
            if hasattr(self, 'do_handle'):
                self.do_handle()
        except ConnectionAbortedError:
            # Expected when browser closes connection
            pass
        except OSError as e:
            if e.errno in [10053, 10054]:
                # Windows connection errors
                pass
            else:
                raise
        except Exception:
            # Let other exceptions bubble up
            raise
    
    def finish(self):
        """Finish request with error handling"""
        try:
            super().finish()
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            # These are all expected when client disconnects
            pass
        except OSError as e:
            if hasattr(e, 'errno') and e.errno in [10053, 10054]:
                pass
            else:
                raise