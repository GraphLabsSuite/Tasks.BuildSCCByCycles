import React from 'react';
import './App.css';

// @ts-ignore
import {select} from 'd3-selection'
import {DirectedGraph, Edge, Graph, IEdge, IGraph, IVertex, SccBuilder, UndirectedGraph, Vertex} from 'graphlabs.core.graphs'
import {GraphVisualizer, IEdgeView, store, Template, Toolbar, ToolButtonList} from "graphlabs.core.template";
import * as data_json from "./stub.json";
import {MatrixOperations} from "graphlabs.core.graphs/build/helpers/MatrixOperations";

let fee: number = 13


class App extends Template {

    step: number = 1
    graph: IGraph<IVertex, IEdge> = new Graph(true) as unknown as IGraph<IVertex, IEdge>;
    components: IGraph<IVertex, IEdge>[] = []
    effort: number = 0
    ball: number = 100

    constructor(props: {}) {
        super(props);
        this.setGraph()
        this.getArea()
        this.calculate = this.calculate.bind(this);
    }

    protected graphManager(data: any): IGraph<IVertex, IEdge> {
        const graph: IGraph<IVertex, IEdge> = new Graph(true) as unknown as IGraph<IVertex, IEdge>;
        if (data) {
            let vertices = data.vertices;
            let edges = data.edges;
            vertices.forEach((v: any) => {
                graph.addVertex(new Vertex(v));
            });

            edges.forEach((e: any) => {
                if (e.name) {
                    graph.addEdge(new Edge(graph.getVertex(e.source)[0], graph.getVertex(e.target)[0], e.name[0], '', true));
                } else {
                    graph.addEdge(new Edge(graph.getVertex(e.source)[0], graph.getVertex(e.target)[0], '', '', true))
                }
            });

        }
        return graph;
    }

    setGraph(){
        // const data = sessionStorage.getItem('variant');
        // console.log("data", data)
        let graph: IGraph<IVertex, IEdge> = new Graph(true) as unknown as IGraph<IVertex, IEdge>;
        let objectData;
        let data: string = JSON.stringify(data_json)
        try {
            objectData = JSON.parse(data|| 'null');
            console.log('The variant is successfully parsed');
        } catch (err) {
            console.log('Error while JSON parsing');
        }
        if (data) {
            graph = this.graphManager(objectData.default.data[0].value);
            console.log(graph)
            console.log('The graph is successfully built from the variant');
        }
        this.components = SccBuilder.findComponents(graph)
        this.graph = graph
        this.effort = 0
        this.step = 1
        this.ball = 100
    }

    getArea(): React.FunctionComponent {
        store.getState().graph = this.graph;
        return () => <GraphVisualizer
            graph={this.graph}
            adapterType={'readable'}
            incidentEdges={false}
            namedEdges={true}
            isDirected={true}
        />;
    }

    getTaskToolbar() {
        Toolbar.prototype.getButtonList = () => {
            function beforeComplete(this: App):  Promise<{ success: boolean; fee: number }> {
                return new Promise((resolve => {
                    resolve(this.calculate());
                }));
            }
            ToolButtonList.prototype.beforeComplete = beforeComplete.bind(this);
            ToolButtonList.prototype.help = () =>
                ' Для раскарски ребер можно воспользоваться тремя цветами:'+
                ' Для окраски ребра в зеленый цвет щелкните по ребру\n' +
                ' Для окраски ребра в синий или красный цвет щелкните по ребру, а затем по соответствующей кнопке\n'+
                ' Гарантируется, что циклов не больше трех(по цислц цветов).\n';

            ToolButtonList.prototype.toolButtons = {
                "http://gl-backend.svtz.ru:5000/odata/downloadImage(name='color_blue.png')": () => {
                    this.changeColor('blue');
                },
                "http://gl-backend.svtz.ru:5000/odata/downloadImage(name='color_red.png')": () => {
                    this.changeColor('red');
                }
            };
            return ToolButtonList;
        };
        return Toolbar;
    }

    changeColor(color: string) {
        const Out = sessionStorage.getItem('out');
        const In = sessionStorage.getItem('in');
        sessionStorage.removeItem('out');
        sessionStorage.removeItem('in');
        select(`#edge_${Out}_${In}`).style('stroke', color);
    }

    getVertexColor(vertexNum: string){
        let vertex = select(`#vertex_${vertexNum}`)
        return vertex.style('fill')
    }

    getEdgeColor(edge: IEdgeView){
        let Out: string = edge.vertexOne;
        let In: string = edge.vertexTwo;
        let color: string
        try {
            color = select(`#edge_${Out}_${In}`).style('stroke');
        }
        catch (err) {
            color =  "black"
        }
        return color
    }
    getVertexCoordinate(vertexNum: string){
        let vertex = select(`#vertex_${vertexNum}`)
        let x: number = Number(vertex.attr('cx'))
        let y: number = Number(vertex.attr('cy'))
        return [x, y]
    }

    compareVerticesCoordinate(vertexOneName: string, vertexTwoName: string){
        let vertexOneNameCoord: number[] = this.getVertexCoordinate(vertexOneName)
        let vertexTwoNameCoord: number[] = this.getVertexCoordinate(vertexTwoName)
        let diffX: number = Math.abs(vertexOneNameCoord[0] - vertexTwoNameCoord[0])
        let diffY: number = Math.abs(vertexOneNameCoord[1] - vertexTwoNameCoord[1])
        return !(diffX > 15 || diffY > 15);
    }

    appendEdge(studentSCC: any, vertexOneName: string, vertexTwoName: string, color: string){
        if (studentSCC[color].length === 0){
            studentSCC[color].push(vertexOneName)
            studentSCC[color].push(vertexTwoName)
        }
        else if (studentSCC[color].indexOf(vertexOneName) === -1){
            studentSCC[color].push(vertexOneName)
        }
        else if (studentSCC[color].indexOf(vertexTwoName) === -1){
            studentSCC[color].push(vertexTwoName)
        }
        return studentSCC
    }

    checkAnswer(studentAnswer: number[][], answer: number[][]): boolean{
        let res: boolean[] = []
        if (answer.length !== studentAnswer.length){
            return false
        }
        for (let i: number = 0; i < answer.length; i++) {
            let component: string = JSON.stringify(answer[i].sort())
            for (let j: number = 0; j < studentAnswer.length; j++) {
                let studentComponent: string = JSON.stringify(studentAnswer[j].sort())
                if (studentComponent === component){
                    res.push(true)
                }
            }
        }
        return res.length === answer.length;
    }

    checkCondensate(condensateComponents: any){
        for (let componentNum: number = 0; componentNum < condensateComponents.length; componentNum++) {
            let component: any = condensateComponents[componentNum]
            for (let componentVertexNum: number = 0; componentVertexNum < component.length; componentVertexNum++) {
                let vertex = component[componentVertexNum]
                for (let componentVertexNumTwo: number = 0; componentVertexNumTwo < component.length; componentVertexNumTwo++) {
                    let res: boolean = this.compareVerticesCoordinate(vertex, component[componentVertexNumTwo])
                    if(!res){
                        return false
                    }
                }
            }
            for (let vertexNotComponentNum: number = 0; vertexNotComponentNum < condensateComponents.length; vertexNotComponentNum++) {
                if(componentNum !== vertexNotComponentNum){
                    let res: boolean = this.compareVerticesCoordinate(component[0], condensateComponents[vertexNotComponentNum][0])
                    if(res){
                        return false
                    }
                }
            }
        }
        return true
    }

    calculate() {
        let student_answer = this.buildStudentAnswer()
        let answer = this.buildCorrectAnswer()
        if(this.step === 1){
            if (this.checkAnswer(student_answer, answer)){
                alert("Вы можете перейти ко второму этапу. Постройте конденсат графа, перетащив вершины.")
                this.step = 2
                this.ball = 100 - (this.effort * 13)
                return {success: true , fee: 0}
            }
            else {
                this.effort = this.effort + 1
                if ( this.effort > 4 ){
                    fee = 0
                    this.ball = 0
                }
                if (this.effort === 4){
                    fee = 61
                    this.ball = 0
                    alert("Упражнение окончено. Вы допустили слишом много ошибок.")
                }
                else if (this.effort < 4){
                    alert("Вы ошиблись. Попробуйте еще раз.")
                }
                return {success: false , fee: fee}
            }
        }
        else if (this.step === 2){
            this.step = 3
            if (this.checkCondensate(answer)){
                alert("Поздравляю, вы справились с заданием.")
                return {success: true , fee: 0}
            }
            else {
                alert("Упражнение окончено. Вы допустили слишом много ошибок.")
                return {success: false, fee: this.ball}
            }
        }
        if (this.ball > 60){
            return {success: true, fee: 0}
        }
        return {success: false, fee: 0}
    }

    buildCorrectAnswer(): any{
        let answer: any = []
        for (let i: number = 0; i < this.components.length; i++) {
            let vertexs: any = this.getScc(this.components[i])
            answer.push(vertexs)
        }
        return answer
    }

    buildStudentAnswer(): any{
        let edges: any = this.graph.edges
        let studentSCC: any = {"blue":[], "red": [], "black": [], "green": []}
        for (let i: number = 0; i < edges.length; i++) {
            let color: string = this.getEdgeColor(edges[i])
            studentSCC = this.appendEdge(studentSCC, edges[i].vertexOne.name, edges[i].vertexTwo.name, color)
        }
        let answer: any = []
        if (studentSCC["blue"].length > 0){
            answer.push(studentSCC["blue"])
        }
        if (studentSCC["red"].length > 0){
            answer.push(studentSCC["red"])
        }
        if (studentSCC["green"].length > 0){
            answer.push(studentSCC["green"])
        }
        for (let i: number = 0; i < this.graph.vertices.length; i++) {
            let color = this.getVertexColor(this.graph.vertices[i].name)
            if(color === "rgb(255, 0, 0)"){
                answer.push([this.graph.vertices[i].name])
            }
        }
        return answer
    }

    getScc(component: IGraph<IVertex, IEdge>){
        let vertices = component.vertices
        let verticesName = []
        for (let i: number = 0; i < vertices.length; i++) {
            verticesName.push(vertices[i].name)
        }
        return verticesName
    }


    task() {
        return () => (
            <div style={{overflow: "auto"}}>
                <p>Цель: Найти компоненты сильной связности с помощь циклового метода</p>
                <p>Данное задание состоит из двух этапов, выполнять их необходимо строго по очереди:</p>
                <div style={{overflow: "auto"}}> <ol>
                    <li>
                        <ul>
                            <li>Необходимо выделить вершины сток, исток, нажав на них.</li>
                            <li>Выделить простые циклы(выделить ребра графа), входящие в одну компоненту сильной связности.</li>
                            <li>Если существуют компоненты сильной связности, состоящие из одной вершины, необходимо нажать на них.</li>
                            <li>Нажать на кнопку проверки в левом меню.Если задание построено правильно, вы можете переходить ко второму этапу</li>
                        </ul>
                    </li>
                    <li>Необходимо построить конденсат, перетащив вершины.</li>
                </ol>
                </div>
            </div>);
    }
}



// export class SccBuilder {
//     /**
//      * Finds strongly connected components
//      * @param graph
//      * @returns {IGraph[]}
//      */
//     public static findComponents(graph: IGraph<IVertex, IEdge>, storng: boolean = true): IGraph<IVertex, IEdge>[] {
//         return (new SccBuilder(graph, storng)).buildComponents();
//     }
//
//     private readonly _accessibilityMatrix: number[][];
//     private readonly _graph: IGraph<IVertex, IEdge>;
//     private readonly _vertices: IVertex[];
//
//     //параметр strong отвечает за то, нужнали у орграфа сильная (true) или слабая (false) связность
//     private constructor(graph: IGraph<IVertex, IEdge>, storng: boolean = true) {
//         this._graph = graph;
//         this._vertices = this._graph.vertices;
//         this._accessibilityMatrix = SccBuilder.buildAccessibilityMatrix(graph, storng);
//     }
//
//     public static buildAccessibilityMatrix(graph: IGraph<IVertex, IEdge>, strong: boolean = true): number[][] {
//         let result: number[][] = [];
//         let diagonal: number[][] = [];
//         let adjacency: number[][] = [];
//         for (let i: number = 0; i < graph.vertices.length; i++) {
//             result[i] = [];
//             diagonal[i] = [];
//             adjacency[i] = [];
//             for (let j: number = 0; j < graph.vertices.length; j++) {
//                 result[i][j] = 0;
//                 if (i == j) {
//                     diagonal[i][j] = 1;
//                 } else {
//                     diagonal[i][j] = 0;
//                 }
//                 if (graph.vertices[j].isAdjacent(graph, graph.vertices[i])) {
//                     adjacency[i][j] = 1;
//                 } else {
//                     adjacency[i][j] = 0;
//                 }
//             }
//         }
//         for (let i: number = 1; i < graph.vertices.length; i++){
//             result = MatrixOperations.Sum(result, MatrixOperations.Power(adjacency, i))
//         }
//         result = MatrixOperations.Sum(result, diagonal);
//         result = MatrixOperations.Binary(result);
//         // if (!strong)
//         //     result = MatrixOperations.DirectedAccessibility(result);
//         return result;
//     }
//
//     private buildComponents(): IGraph<IVertex, IEdge>[] {
//         const s: number[][] = [];
//         for (let i: number = 0; i < this._graph.vertices.length; i++) {
//             s[i] = [];
//             for (let j: number = 0; j < this._graph.vertices.length; j++)
//                 s[i][j] = this._accessibilityMatrix[i][j] * this._accessibilityMatrix[j][i];
//         }
//
//         const added: boolean[] = new Array(this._graph.vertices.length);
//         for (let i: number = 0; i < added.length; i++)
//             added[i] = false;
//
//         const components: IGraph<IVertex, IEdge>[] = [];
//         for (let i: number = 0; i < this._graph.vertices.length; i++) {
//             if (added[i])
//                 continue;
//             // @ts-ignore
//             const scc: IGraph<IVertex, IEdge> = this._graph.isDirected
//                 ? new DirectedGraph()
//                 : new UndirectedGraph();
//
//             added[i] = true;
//             scc.addVertex(this._vertices[i]);
//             for (let j: number = 0; j < this._graph.vertices.length; j++)
//                 if (!added[j] && s[i][j] == 1) {
//                     added[j] = true;
//                     scc.addVertex(this._vertices[j]);
//                 }
//             components.push(scc);
//         }
//
//         this._graph.edges.forEach(edge => {
//             const whereToAdd =
//                 components.filter(c => c.vertices.indexOf(edge.vertexOne) != -1 &&
//                     c.vertices.indexOf(edge.vertexTwo) != -1);
//             whereToAdd.forEach(c => c.addEdge(edge));
//         });
//         return components;
//     }
// }



export default App;


