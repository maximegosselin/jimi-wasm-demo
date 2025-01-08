const app = {
    controls: {
        tuning: ['E', 'A', 'D', 'G', 'B', 'E'],
        root: 'C',
        pattern: 'chromatic',
        dispIntervals: 'false',
    },
    fretboards: [],
    wasm: {
        go: null,
        module: null,
        addToWorkspace: false,
    },
    init() {
        window.console.log = (message) => {
            this.onFretboardRendered((new AnsiUp()).ansi_to_html(message));
        };
        this.wasm.go = new Go();
        WebAssembly.instantiateStreaming(fetch("jimi.wasm"), this.wasm.go.importObject)
            .then((result) => {
                this.wasm.module = result.module;
                this.$watch('controls', () => {
                    this.onControlsChanged();
                });
                this.drawFretboard(
                    this.controls.tuning,
                    this.controls.root,
                    this.controls.pattern,
                    this.controls.dispIntervals,
                    false,
                );
                this.loadWorkspace();
            });
    },
    loadWorkspace() {
        this.fretboards = JSON.parse(localStorage.getItem('fretboards') || '[]');
        this.fretboards.forEach((item) => {
            this.drawFretboard(item[0], item[1], item[2], item[3], true);
        });
    },
    saveWorkspace() {
        localStorage.setItem('fretboards', JSON.stringify(this.fretboards));
    },
    drawFretboard(tuning, root, pattern, dispIntervals, addToWorkspace) {
        if (!this.wasm.module) {
            return;
        }
        this.wasm.addToWorkspace = addToWorkspace;
        WebAssembly.instantiate(this.wasm.module, this.wasm.go.importObject)
            .then((instance) => {
                this.wasm.go.argv = ['jimi', `-t=${tuning.join('')}`, `-r=${root}`, `-p=${pattern}`, `-i=${dispIntervals}`];
                this.wasm.go.run(instance);
            });
    },
    addCurrentToWorkspace() {
        this.addToWorkspace(
            this.controls.tuning,
            this.controls.root,
            this.controls.pattern,
            this.controls.dispIntervals,
        );
    },
    addToWorkspace(tuning, root, pattern, dispIntervals) {
        this.fretboards.push([tuning, root, pattern, dispIntervals]);
        this.saveWorkspace();
    },
    onControlsChanged() {
        if (this.controls.pattern === 'custom') {
            this.controls.pattern = window.prompt('Custom pattern\nEx: R-M3-P5-m7');
            return;
        }
        this.drawFretboard(
            this.controls.tuning,
            this.controls.root,
            this.controls.pattern,
            this.controls.dispIntervals,
            false,
        );
    },
    onFretboardRendered(html) {
        if (this.wasm.addToWorkspace) {
            document.getElementById("workspace").innerHTML += html;
        } else {
            document.getElementById("console").innerHTML = html;
        }
    },
};