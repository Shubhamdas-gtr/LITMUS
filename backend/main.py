from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def root():
    return {"message": "LITMUS API is running"}