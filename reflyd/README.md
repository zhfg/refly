# reflyd

# Setup

```bash
# install dependencies
brew install pyenv pipx
pipx ensurepath
pipx install poetry
poetry install

# start the server
uvicorn app.main:app --reload
```