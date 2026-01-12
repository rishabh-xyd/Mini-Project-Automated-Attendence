import sys
import traceback

with open("crash.log", "w", encoding="utf-8") as f:
    try:
        import models
        f.write(f"Models file: {models.__file__}\n")
        f.flush()
        
        import main
        f.write(f"Main imported. Running startup_event...\n")
        f.flush()
        main.startup_event()
        f.write("Startup successful!\n")
    except Exception:
        traceback.print_exc(file=f)
