const socket = io.connect(location.protocol + '//' + location.host);
const textarea = document.getElementById('data');
const { h, diff, patch, create: createElement } = virtualDom;

let doc = '';
let trees = {
    head: h('head', ['']),
    body: h('body', ['']),
};
let rootNode = document.documentElement;

socket.on('document', ({ data }) => {
    doc = data;
    update();
})

socket.on('commit', ({ start, length, data }) => {
    doc = doc.substring(0, start) + data + doc.substring(start + length);
    update();
})

document.head.innerHTML = '';
document.body.innerHTML = '';

function apply(label, newTree) {
    const patches = diff(trees[label], newTree);
    trees[label] = newTree;

    document[label] = patch(document[label], patches);
}

function update() {
    html2hscript(doc, (err, script) => {
        if (err) {
            console.error(err);
            return;
        }

        const newTree = eval(script);
        const headTree = newTree.children.find(element => element.tagName === 'HEAD');
        const bodyTree = newTree.children.find(element => element.tagName === 'BODY');

        apply('head', headTree);
        apply('body', bodyTree);
    });
}
