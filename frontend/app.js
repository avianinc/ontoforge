document.addEventListener('DOMContentLoaded', function () {
    var cy = cytoscape({
        container: document.getElementById('cy'),
        elements: [],
        style: [
            {
                selector: 'node',
                style: {
                    'label': 'data(label)',
                    'background-color': '#0074D9',
                    'color': '#000',  // Change text color to black
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'width': '60px',
                    'height': '60px'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 3,
                    'line-color': '#0074D9',
                    'target-arrow-color': '#0074D9',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier'
                }
            }
        ],
        layout: {
            name: 'circle'
        }
    });

    function stripPrefix(uri) {
        const prefix = 'http://example.org/ontology#';
        if (uri.startsWith(prefix)) {
            return uri.slice(prefix.length);
        }
        return uri;
    }

    fetch('/api/ontology')
        .then(response => response.json())
        .then(data => {
            const elements = [];
            data.forEach(element => {
                if (element.source && element.target) {
                    elements.push({
                        group: 'nodes',
                        data: { id: element.source, label: stripPrefix(element.source) }
                    });
                    elements.push({
                        group: 'nodes',
                        data: { id: element.target, label: stripPrefix(element.target) }
                    });
                    elements.push({
                        group: 'edges',
                        data: { source: element.source, target: element.target }
                    });
                }
            });
            cy.add(elements);
            cy.layout({ name: 'circle' }).run();
        })
        .catch(error => console.error('Error fetching data:', error));

    window.addNode = function () {
        const nodeId = document.getElementById('node-id').value;
        fetch('/api/ontology', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uri: `http://example.org/ontology#${nodeId}` })
        }).then(() => {
            cy.add({ data: { id: `http://example.org/ontology#${nodeId}`, label: nodeId } });
            cy.layout({ name: 'circle' }).run();
        }).catch(error => console.error('Error adding node:', error));
    };

    window.addEdge = function () {
        const sourceId = document.getElementById('source-id').value;
        const targetId = document.getElementById('target-id').value;
        fetch('/api/ontology', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source: `http://example.org/ontology#${sourceId}`, target: `http://example.org/ontology#${targetId}` })
        }).then(() => {
            cy.add({
                group: 'edges',
                data: { source: `http://example.org/ontology#${sourceId}`, target: `http://example.org/ontology#${targetId}` }
            });
            cy.layout({ name: 'circle' }).run();
        }).catch(error => console.error('Error adding edge:', error));
    };

    window.syncFuseki = function () {
        fetch('/api/sync', {
            method: 'POST'
        }).then(() => {
            console.log('Sync completed');
        }).catch(error => console.error('Error syncing Fuseki:', error));
    };
});
