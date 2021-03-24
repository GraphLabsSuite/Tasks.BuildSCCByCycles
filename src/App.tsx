import React from 'react';
import './App.css';

// @ts-ignore
import {select} from 'd3-selection'
import {Edge, Graph, IEdge, IGraph, IVertex, UndirectedGraph, Vertex} from 'graphlabs.core.graphs'
import {Template, ToolButtonList, Toolbar, store, IEdgeView, GraphVisualizer} from "graphlabs.core.template";
import * as data_json from "./stub.json";
import {DirectedGraph} from "graphlabs.core.graphs/build/main/DirectedGraph";
import {MatrixOperations} from "graphlabs.core.graphs/build/helpers/MatrixOperations";

let fee: number = 13


class App extends Template {

    step: number = 1
    graph: IGraph<IVertex, IEdge> = new Graph(true) as unknown as IGraph<IVertex, IEdge>;
    components: IGraph<IVertex, IEdge>[] = []
    num: number = 0
    ball: number = 100

    constructor(props: {}) {
        super(props);
        this.setGraph()
        this.getArea()
        this.calculate = this.calculate.bind(this);
    }

    protected graphManager(data: any): IGraph<IVertex, IEdge> {
        // TODO: fix the types
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
                    graph.addEdge(new Edge(graph.getVertex(e.source)[0], graph.getVertex(e.target)[0], '', '', true));
                }
            });

        }
        return graph;
    }

    setGraph(){
        // const data = sessionStorage.getItem('variant');
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
            console.log('The graph is successfully built from the variant');
        }
        this.components = this.buildScc(graph)
        this.graph = graph
        this.num = 0
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
                'Для раскарски ребер можно воспользоваться тремя цветами:'+
                'Для окраски ребра в зеленый цвет щелкните по ребру\n' +
                'Для окраски ребра в синий или красный цвет щелкните по ребру, а затем по соответствующей кнопке\n'+
                'Гарантируется, что циклов не больше трех(по цислц цветов).\n';;

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

    getVertexColor(i: string){
        let vertex = select(`#vertex_${i}`)
        let color = vertex.style('fill')
        return color
    }

    getEdgeColor(edge: IEdgeView){
        let Out: string = edge.vertexOne;
        let In: string = edge.vertexTwo;
        let color: string = "black"
        try {
            color = select(`#edge_${Out}_${In}`).style('stroke');
        }
        catch (err) {
            color =  "black"
        }
        return color
    }
    getVertexCoordinate(i: string){
        let vertex = select(`#vertex_${i}`)
        let x = Number(vertex.attr('cx'))
        let y = Number(vertex.attr('cy'))
        let coord: number[] = [x, y]
        return coord
    }

    compareVertiesCoordinate(vertexOneName: string, vertexTwoName: string){
        let vertexOneNameCoord = this.getVertexCoordinate(vertexOneName)
        let vertexTwoNameCoord = this.getVertexCoordinate(vertexTwoName)
        let diffX = Math.abs(vertexOneNameCoord[0] - vertexTwoNameCoord[0])
        let diffy = Math.abs(vertexOneNameCoord[1] - vertexTwoNameCoord[1])

        return !(diffX > 15 || diffy > 15);
    }

    appendEdge(scc_student: any, vertexOneName: string, vertexTwoName: string, color: string){
        if (scc_student[color].length === 0){
            scc_student[color].push(vertexOneName)
            scc_student[color].push(vertexTwoName)
        }
        else if (scc_student[color].indexOf(vertexOneName) === -1){
            scc_student[color].push(vertexOneName)
        }
        else if (scc_student[color].indexOf(vertexTwoName) === -1){
            scc_student[color].push(vertexTwoName)
        }
        return scc_student
    }

    checkAnswer(student_answer: number[][], answer: number[][]): boolean{
        let res: boolean[] = []
        if (answer.length !== student_answer.length){
            return false
        }
        for (let i: number = 0; i < answer.length; i++) {
            let ans: number[] = answer[i].sort()

            for (let j: number = 0; j < student_answer.length; j++) {
                let std: number[] = student_answer[j].sort()
                let arr1 = JSON.stringify(std)
                let arr2 = JSON.stringify(ans)
                if (arr2 === arr1){
                    res.push(true)
                }
            }
        }
        if (res.length === answer.length){
            return true
        }
        return false
    }
    checkCondensate(){
        let CondensateComponents = this.buildCorrectAnswer()
        for (let i: number = 0; i < CondensateComponents.length; i++) {
            let component: any = CondensateComponents[i]

            for (let j: number = 0; j < component.length; j++) {
                let vertex = component[j]

                for (let f: number = 0; f < component.length; f++) {
                    let res: boolean = this.compareVertiesCoordinate(vertex, component[f])
                    if(!res){
                        return false
                    }
                }
            }
            for (let c: number = 0; c < CondensateComponents.length; c++) {
                if(i !== c){
                        let res: boolean = this.compareVertiesCoordinate(component[0], CondensateComponents[c][0])
                        if(res){
                            return false
                        }
                    }
                }
        }
        alert("condensate")
        return true
    }

    calculate() {
        let student_answer = this.buildStudentAnswer()
        let answer = this.buildCorrectAnswer()

        if(this.step === 1){
            if (this.checkAnswer(student_answer, answer)){
                alert("Вы можете перейти ко второму этапу. Постройте конденсат графа, перетащив вершины.")
                this.step = 2
                this.ball = 100 - (this.num * 13)
                return {success: true , fee: 0}
            }
            else {
                this.num = this.num + 1
                if ( this.num > 4 ){
                    fee = 0
                    this.ball = 0
                }
                if (this.num === 4){
                    fee = 61
                    this.ball = 0
                    alert("Упражнение окончено. Вы допустили слишом много ошибок.")
                }
                else if (this.num < 4){
                    alert("Вы ошиблись. Попробуйте еще раз.")
                }
                return {success: false , fee: fee}
            }
        }
        else if (this.step === 2){
            this.step = 3
            if (this.checkCondensate()){
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
        let scc_student: any = {"blue":[], "red": [], "black": [], "green": []}
        for (let i: number = 0; i < edges.length; i++) {
            let color: string = this.getEdgeColor(edges[i])
            scc_student = this.appendEdge(scc_student,edges[i].vertexOne.name, edges[i].vertexTwo.name, color )
        }
        let answer: any = []
        if (scc_student["blue"].length > 0){
            answer.push(scc_student["blue"])
        }
        if (scc_student["red"].length > 0){
            answer.push(scc_student["red"])
        }
        if (scc_student["green"].length > 0){
            answer.push(scc_student["green"])
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
        let vertices_name = []

        for (let i: number = 0; i < vertices.length; i++) {
            vertices_name.push(vertices[i].name)
        }
        return vertices_name
    }

    buildScc(graph: IGraph<IVertex, IEdge>):IGraph<IVertex, IEdge>[]{
        return SccBuilderNew.findComponents(graph)
    }

    task() {
        return () => (
            <div style={{overflow: "auto"}}>
                <p>Цель: Найти компонент сильной связности с помощь циклового метода</p>
                <p>Данное задание состоит из двух этапов, выполнять их необходимо строго по очереди:</p>
                <div style={{overflow: "auto"}}> <ol>
                    <li>
                        <ul>
                            <li>Необходимо выделить вершину сток, исток, нажав на них.</li>
                            <li>Выделить простые циклы(выделить ребра графа), входящие в одну компоненты сильной связности.</li>
                            <li>Если существуют компоненты сильной связности, состоящие из одной вершины, необходимо нажать на них.</li>
                            <li>Нажать на кнопку проверки в левом меню.Если задание постреено правильно, вы можете переходить ко второму этапу</li>
                        </ul>
                    </li>
                    <li>Необходимо построить конденсат, перетащив вершины.</li>
                </ol>
                </div>
            </div>);
    }

}

export class SccBuilderNew {
    /**
     * Finds strongly connected components
     * @param graph
     * @returns {IGraph[]}
     */
    public static findComponents(graph: IGraph<IVertex, IEdge>): IGraph<IVertex, IEdge>[] {
        return (new SccBuilderNew(graph)).buildComponents();
    }

    private readonly _accessibilityMatrix: number[][];
    private readonly _graph: IGraph<IVertex, IEdge>;
    private readonly _vertices: IVertex[];

    private constructor(graph: IGraph<IVertex, IEdge>) {
        this._graph = graph;
        this._vertices = this._graph.vertices;
        this._accessibilityMatrix = SccBuilderNew.buildAccessibilityMatrix(graph);
    }

    public static buildAccessibilityMatrix(graph: IGraph<IVertex, IEdge>): number[][] {
        let result: number[][] = [];
        let diagonal: number[][] = [];
        for (let i: number = 0; i < graph.vertices.length; i++) {
            result[i] = [];
            diagonal[i] = [];
            for (let j: number = 0; j < graph.vertices.length; j++) {
                if (i == j) {
                    diagonal[i][j] = 1;
                } else {
                    diagonal[i][j] = 0;
                }

                if (graph.vertices[j].isAdjacent(graph, graph.vertices[i])) {
                    let edges: IEdge[] = graph.getEdge(graph.vertices[j], graph.vertices[i])
                    if  (edges.length == 2) {
                        result[i][j] = 1;
                    }
                    else {
                        result[i][j] = 0;

                    }
                    if (edges.length == 1){
                        if (edges[0].vertexOne == graph.vertices[j]){
                            result[i][j] = 1;
                        }
                        else {
                            result[i][j] = 0;

                        }
                    }
                } else {
                    result[i][j] = 0;
                }
            }
        }
        for (let i: number = 0; i < graph.vertices.length; i++){
            result = MatrixOperations.Sum(result, MatrixOperations.Power(result, i))
        }
        result = MatrixOperations.Sum(result, diagonal);
        result = MatrixOperations.Binary(result);
        return result;
    }

    //TODO: кажется, тут местами можно немного проще сделать
    private buildComponents(): IGraph<IVertex, IEdge>[] {
        const s: number[][] = [];
        for (let i: number = 0; i < this._graph.vertices.length; i++) {
            s[i] = [];
            for (let j: number = 0; j < this._graph.vertices.length; j++)
                s[i][j] = this._accessibilityMatrix[i][j] * this._accessibilityMatrix[j][i];
        }

        const added: boolean[] = new Array(this._graph.vertices.length);
        for (let i: number = 0; i < added.length; i++)
            added[i] = false;

        const components: IGraph<IVertex, IEdge>[] = [];
        for (let i: number = 0; i < this._graph.vertices.length; i++) {
            if (added[i])
                continue;
            // @ts-ignore
            const scc: IGraph<IVertex, IEdge> = this._graph.isDirected
                ? new DirectedGraph()
                : new UndirectedGraph();

            added[i] = true;
            scc.addVertex(this._vertices[i]);
            for (let j: number = 0; j < this._graph.vertices.length; j++)
                if (!added[j] && s[i][j] == 1) {
                    added[j] = true;
                    scc.addVertex(this._vertices[j]);
                }
            components.push(scc);
        }

        this._graph.edges.forEach(edge => {
            const whereToAdd =
                components.filter(c => c.vertices.indexOf(edge.vertexOne) != -1 &&
                    c.vertices.indexOf(edge.vertexTwo) != -1);
            whereToAdd.forEach(c => c.addEdge(edge));
        });
        return components;
    }
}

export default App;


