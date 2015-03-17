# kanban-task-gen

A kanban board for your screen and your wall.

Run a board in your browser, print every card as a post-it, and pass snapshots
around as plain JSON files. Everything stays on your machine.

## Try it

Live at <https://helmedeiros.github.io/kanban-task-gen/>.

Pick **★ Demo board** from the board switcher to see a fully populated example
without typing a single card.

## Run locally

It's a static site. Open `index.html` directly in a browser, or serve the
folder with anything that ships HTTP:

    python3 -m http.server 8765

Then visit <http://localhost:8765>.

## Tests

Open `test/SpecRunner.html` in a browser. Jasmine runs the suite inline.

## Lint

    npm install
    npm run lint

## License

See `LICENSE`. Short version: do whatever you want.
