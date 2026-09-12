import os
import sys

if __name__ == "__main__":
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
    os.chdir(backend_dir)
    sys.path.insert(0, backend_dir)
    import uvicorn
    print("==================================================================")
    print(" MediKiosk Clinical Intake & Decision-Support Local Server")
    print("==================================================================")
    print(" - Patient Kiosk:   http://localhost:8000/kiosk/")
    print(" - Doctor Console:  http://localhost:8000/portal/")
    print(" - API Docs:        http://localhost:8000/docs")
    print("==================================================================")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
