from flask import Flask, request, jsonify, send_from_directory
from py2neo import Graph, Node, Relationship
from SPARQLWrapper import SPARQLWrapper, JSON

app = Flask(__name__)

# Neo4j configuration
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "testpassword"
graph = Graph(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

# Fuseki configuration
FUSEKI_URL = "http://localhost:3030/model/sparql"

def sync_fuseki():
    query = "MATCH (n)-[r]->(m) RETURN n, r, m"
    results = graph.run(query)
    sparql = SPARQLWrapper(FUSEKI_URL)
    sparql.setMethod('POST')
    sparql.setReturnFormat(JSON)
    
    for record in results:
        sparql.setQuery(f"""
        INSERT DATA {{
            <{record['n']['uri']}> <{type(record['r']).__name__}> <{record['m']['uri']}>
        }}
        """)
        sparql.query()

@app.route('/api/ontology', methods=['GET', 'POST'])
def manage_ontology():
    if request.method == 'GET':
        # Fetch ontology from Neo4j
        query = "MATCH (n)-[r]->(m) RETURN n, r, m"
        results = graph.run(query)
        data = []
        for record in results:
            data.append({
                'source': record['n']['uri'],
                'target': record['m']['uri'],
                'relationship': type(record['r']).__name__
            })
        return jsonify(data)
    
    elif request.method == 'POST':
        # Add node or edge to Neo4j
        data = request.json
        if 'uri' in data:
            node = Node("Entity", uri=data['uri'])
            graph.merge(node, 'Entity', 'uri')
            sync_fuseki()
            return jsonify({'status': 'Node added'}), 201
        elif 'source' in data and 'target' in data:
            source = graph.nodes.match("Entity", uri=data['source']).first()
            target = graph.nodes.match("Entity", uri=data['target']).first()
            if source and target:
                relationship = Relationship(source, "RELATED_TO", target)
                graph.merge(relationship)
                sync_fuseki()
                return jsonify({'status': 'Edge added'}), 201
        return jsonify({'status': 'Invalid data'}), 400

@app.route('/api/sync', methods=['POST'])
def sync_fuseki_endpoint():
    sync_fuseki()
    return jsonify({'status': 'Sync completed'}), 200

@app.route('/')
def index():
    return send_from_directory('../frontend', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('../frontend', path)

if __name__ == '__main__':
    app.run(debug=True)
