import React from 'react';
import './App.css';

// @ts-ignore
import {select} from 'd3-selection'
import {DirectedGraph, Edge, Graph, IEdge, IGraph, IVertex, SccBuilder, Vertex} from 'graphlabs.core.graphs'
import {GraphVisualizer, IEdgeView, store, Template, Toolbar, ToolButtonList} from "graphlabs.core.template";
import * as data_json from "./stub.json";

let fee: number = 13


function getRandomNumber(min: number, max: number): number {
    min = Math.ceil(min)
    max = Math.floor(max) + 1
    return Math.floor(Math.random() * (max - min)) + min
}

function getRandomElementArray(arr: Array<any>){
    let rand = Math.floor(Math.random() * arr.length);
    return arr[rand]
}


let maxVerIndex = 0

class SCCGraphGenerator {
    maxCmp: number = 2
    minCmp: number = 4
    cmpNum: number
    components: Array<any>
    graph: any
    allVertices: Array<any>
    allEdges: Array<any>

    constructor() {
        this.components = []
        this.allEdges = []
        this.allVertices = []
        this.cmpNum = getRandomNumber(this.minCmp, this.maxCmp)
        this.generateSCC()
        this.connectComponents()
        this.generateSingleSCC()
        this.graph = this.getGraph()
    }

    generateSCC() {
        for (let i = 0; i < this.cmpNum; i++) {
            let cmp = new SCCGenerator()
            let parsedCmp = cmp.getComponent()

            this.components.push(parsedCmp)
            for (let v of parsedCmp.vertices) {
                this.allVertices.push(v)
            }
            for (let e of parsedCmp.edges) {
                this.allEdges.push(e)
            }
        }
    }

    connectComponents() {
        for (let i = 0; i < this.components.length - 1; i++) {
            let source = getRandomElementArray(this.components[i].vertices)
            let target: string
            if(i + 1 === this.components.length){
                target = getRandomElementArray(this.components[0].vertices)
            }
            else {
                target = getRandomElementArray(this.components[i + 1].vertices)
            }
            let edge = {"source": source, "target": target, "isDirected": true}
            this.allEdges.push(edge)
        }
    }

    generateSingleSCC() {
        let numOfStarts = getRandomNumber(0, 3)
        let index = maxVerIndex + 1

        if (this.allEdges.length > 24) return

        for (let i = 0; i <= numOfStarts; i++) {
            let source: string = String(index)
            this.allVertices.push(source)
            index++

            let numOfDestination = getRandomNumber(1, 2)

            for (let d = 0; d <= numOfDestination; d++) {
                let destinationCmp = getRandomElementArray(this.components)
                let destinationVertice = getRandomElementArray(destinationCmp.vertices)

                let edge = {"source": source, "target": destinationVertice, "isDirected": true}

                let parseEdge = JSON.stringify(edge)
                let parseAllEdges = JSON.stringify(this.allEdges)

                if (parseAllEdges.indexOf(parseEdge) === -1) this.allEdges.push(edge)
            }
        }
    }

    getGraph() {
        return {
            vertices: this.allVertices,
            edges: this.allEdges
        }
    }
}



class SCCGenerator{
    vertexes: any
    edges: any
    verNumber: number

    constructor() {
        this.vertexes = []
        this.edges = []
        this.verNumber = getRandomNumber(2, 4)
        this.generateVertexes()
        this.generateCycle()
    }

    generateCycle(){
        let listVertex = []
        for(let i: number = 0; i < this.verNumber; i++) listVertex.push(this.vertexes[i])

        let destinations = []
        let source = listVertex.shift()
        let first = source

        while(listVertex.length > 0){
            if (listVertex.length == 1) {
                let edge = {"source": source, "target": listVertex[0], "isDirected": true}
                this.edges.push(edge)
                source = listVertex[0]
                break
            }
            let destination = getRandomElementArray(listVertex)
            // @ts-ignore
            let destinationIndex = listVertex.findIndex(i => i == destination)

            let edge = {"source": source, "target": destination, "isDirected": true}
            this.edges.push(edge)

            source = destination
            listVertex.splice(destinationIndex,1)
        }

        let edge = {"source": source, "target": first, "isDirected": true}
        this.edges.push(edge)

        let extraEdgesNumber = getRandomNumber(0, this.vertexes.length - 2)
        while (extraEdgesNumber > 0){
            let source = getRandomElementArray(this.vertexes)
            let destination = getRandomElementArray(this.vertexes)

            if(source !== destination) {

                let edge = {"source": source, "target": destination, "isDirected": true}
                let parseEdge = JSON.stringify(edge)
                let parseAllEdges = JSON.stringify(this.edges)

                if (parseAllEdges.indexOf(parseEdge) === -1) {
                    this.edges.push(edge)
                    extraEdgesNumber--
                }
            }
        }
    }

    generateVertexes(){
        for(let i: number = 0; i < this.verNumber;){
            let ver = String(maxVerIndex)
            if(this.vertexes.indexOf(ver) === -1){
                this.vertexes.push(ver)
                i++
            }
            maxVerIndex++
        }
    }

    generateEdges(){
        let destinations = []


        while(destinations.length !== this.vertexes.length){

            let source = getRandomElementArray(this.vertexes)
            let destination = getRandomElementArray(this.vertexes)

            if(source !== destination){

                let edge = {"source": source, "target": destination, "isDirected": true}
                let parseEdge = JSON.stringify(edge)
                let parseAllEdges = JSON.stringify(this.edges)

                if(parseAllEdges.indexOf(parseEdge) === -1){
                    this.edges.push(edge)
                    if(destinations.indexOf(destination) === -1) {
                        destinations.push(destination)
                    }
                }
            }
        }
    }

    getComponent(){
        return {
            vertices: this.vertexes,
            edges: this.edges
        }
    }
}


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
        let graph: IGraph<IVertex, IEdge> = new Graph(true) as unknown as IGraph<IVertex, IEdge>;
        let data = new SCCGraphGenerator()
        graph = this.graphManager(data.getGraph());
        console.log('The graph is successfully built from the variant', graph)
        this.components = SccBuilder.findComponents(graph)
        console.log("correct_componetns ", this.components)
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
                ' Для раскарски ребер можно воспользоваться 7 цветами:'+
                ' Для окраски ребра в зеленый цвет щелкните по ребру\n' +
                ' Для окраски ребра в другие цвет щелкните по ребру, а затем по соответствующей кнопке\n'+
                ' Гарантируется, что циклов не больше 7(по числу цветов).\n';

            ToolButtonList.prototype.toolButtons = {
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAYAAACoYAD2AAAAwklEQVRYhe3ZMQ6EIBCFYQ6DJ+IGxsJbTEPiJbiWFVa0EDzC28I1YY2h3BnjkPwJ5Ve/Mbi8dQW8B4j+n/dAjFcRYM5PKYBzgDH8OQfkfEHuO2AtP65tGIBaG+Q48qPumqYvMiV+TK+UABMCP6RXCIAh4of0WpYHIIkUqUhZKVKR0lKkIqWlSEVKS5GKlJYiFSktRb4P+YhVbdv4Ib1Sguyld56bObrWY6PmRrVZe2z5P9eHnGVdH0q5OZGcL0Z5d5wPlcr1BokdprAAAAAASUVORK5CYII=": () => {
                    this.changeColor('blue');
                },
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAYAAACoYAD2AAAA6klEQVRYhe3ZQQqCQBTG8TlER8gj6EW8gESLVhF0ADdCuBA6gDvPFARmCzEQdByZcNXoaxGSWbhsXvQG/jDL3/p9DEbvdjyADDyQvvv9Ag9UEo9JwPpPy0vgjg2XGdMed2xoy+IV2dUCcnOuHTcstwzoRPVEivVCO+pTYrN8IFWWasdMpbIUWBOF2iFTNVEITPqudshU1/0OP1L6LiEJiSpCEhJbhCQktghJSGwRkpDYIiQhsUXI/0P+xFVNnU/aIVOpLEV+6d2uBjdzUUFuGdpRw3JzDl0tRutDWeBaH3j5PpH0TyUxuh3nDkYt0C9a89nSAAAAAElFTkSuQmCC": () => {
                    this.changeColor('red');
                },
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAYAAACoYAD2AAAAsklEQVRYhe3ZsQ3CMABEUQ8TJsoGiIIt3ERiiaxFFSq3RGGET2FiWQG5zUWcpa9YqV59DmzPHRiAuEMDMH2JCOU2A/3nz971wHOLfAGdAK7uBCw18iyA+tVlRSYBTKsEgVEA0mqEQBSAtLodARmNNFIsI41Uy0gj1TLSSLWMNFItI41Uy8j/Qx5iVXsIQFql/NFdeq8AK3Ihb9R7o+o68pZfkJDXfqXXh7nIKuR6JuTecd6+KBAsyN2XFwAAAABJRU5ErkJggg==": () => {
                    this.changeColor('fuchsia');
                },
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAYAAACoYAD2AAAAtElEQVRYhe3ZMQ6CMACF4R4GTsQNjIO3YCHxElzLCaeuEj3C71DARkzXPuJr8icN07ewvAZ25wYMQF+hAZh2ovC5zkC3fKpdBzy+kS+gEcDltcAzR54EUL86r8gogCkVCTAKQEqNhPRX1YaUuh4B2RtppFhGGqmWkUaqZaSRahlppFpGGqmWkf+HPMSqdheAlIoEAN2l9wLLjbRNtwKovIa05W9ISGu/0uvDvMky5Hom1N5x3tk/ECxAKOzUAAAAAElFTkSuQmCC": () => {
                    this.changeColor('yellow');
                },
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAYAAACoYAD2AAAAvklEQVRYhe3ZMQrDMAyFYd//BjmB7+ApySyc0bcICA22J3UoJWkoHiuFPMEPHr/5Oejl9n3XnLMS0d/LOSszX0kaPo9aq6aUdJom81JKWmv9RvbeNcZojjsXY9TW2oGc59kc9atlWd5IETHHjBIRDaUUc8ioUooGIjKHjNq2zT+SiIAE0lVAAuktIIH0FpBAegtIIL0FJJDeAvJ5yFusasxsDhklIr6X3nVdjzm6teZyM++93+z34XzM7O4f5wUlU9e2R+NahgAAAABJRU5ErkJggg==": () => {
                    this.changeColor('silver');
                },
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAYAAACoYAD2AAAA7klEQVRYhe3ZTwqCQBTH8TmMnqCDKHSDiOgCrhQkkjqCLoQi2guCdADP0MraTJCY/7Bw/VqEZBYumxe9gS/M8rN+Pwaddz7uIXAt8B3z6wWuBQmPuiRgzedWZmBrQ5gMmPBsbQi3Mn1F1tcSdEUSjmtnqDLUVfFErmcj4ahPbebjBzKPuXBMX3nMgYWeKxzSV+i5wHzHFA7pa7da4kf6jklIQqKKkITEFiEJiS1CEhJbhCQktghJSGwR8v+QP3FVu5wOwiF95THHfendLqatm3lVgKHKwlHtdEWC+lp214cU2fqQvU8kzUt4hG7HuQNY0YNUuDtj1gAAAABJRU5ErkJggg==": () => {
                    this.changeColor('sienna');
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
    appendVertexEdge(studentSCC: any, vertexOneName: string, vertexTwoName: string, color: string){
        studentSCC[color].push(vertexOneName)
        studentSCC[color].push(vertexTwoName)
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
        console.log("student_answer", student_answer)
        console.log("correct_answer", answer)
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

    deleteDuplicateVertex(scc: any){
        let vertex_number: any = {}
        if( scc.length === 2) return scc
        for (let i: number = 0; i < scc.length; i++) {
            vertex_number[scc[i]] = 0
        }
        for (let i: number = 0; i < scc.length; i++) {
           vertex_number[scc[i]] = ++vertex_number[scc[i]]
        }
        let res: any = []
        for (let key in vertex_number) {
            const value = vertex_number[key]
            if (value > 1) res.push(key)
        }
        return res
    }

    compareDict(studentAnswer: any, answer: any): boolean {
        let res: boolean[] = []
        let num1 = 0
        let num2 = 0
        if (answer.length !== studentAnswer.length) {
            return false
        }
        for (let i in answer) {
            if(answer[i].length > 0){
                num1 = ++num1
                num2 = 0
                let component: string = JSON.stringify(answer[i].sort())
                for (let j in studentAnswer) {
                    if(studentAnswer[j].length > 0){
                        num2 = ++num2
                        let studentComponent: string = JSON.stringify(studentAnswer[j].sort())

                        if (studentComponent === component) {
                            res.push(true)
                        }}
                }}
        }
        if (res.length === num1 && num1 == num2) return true
        return false
    }
    buildStudentAnswer(): any{
        let edges: any = this.graph.edges
        let studentSCC: any = {
            "blue":[], "red": [], "black": [], "green": [],
            "fuchsia": [], "yellow": [], "silver": [], "sienna": []
        }
        let studentSCCWithDubl: any = {
            "blue":[], "red": [], "black": [], "green": [],
            "fuchsia": [], "yellow": [], "silver": [], "sienna": []
        }
        for (let i: number = 0; i < edges.length; i++) {
            let color: string = this.getEdgeColor(edges[i])
            studentSCC = this.appendEdge(studentSCC, edges[i].vertexOne.name, edges[i].vertexTwo.name, color)
            studentSCCWithDubl = this.appendVertexEdge(studentSCCWithDubl, edges[i].vertexOne.name, edges[i].vertexTwo.name, color)
        }
        for (let key in studentSCCWithDubl) {
            let value = studentSCCWithDubl[key]
            studentSCCWithDubl[key] = this.deleteDuplicateVertex(value)
        }
        delete studentSCCWithDubl["black"]
        delete studentSCC["black"]

        let res = this.compareDict(studentSCC, studentSCCWithDubl)
        console.log(res)
        console.log(studentSCC, studentSCCWithDubl)
        if (!res) return []

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
        if (studentSCC["yellow"].length > 0){
            answer.push(studentSCC["yellow"])
        }
        if (studentSCC["sienna"].length > 0){
            answer.push(studentSCC["sienna"])
        }
        if (studentSCC["silver"].length > 0){
            answer.push(studentSCC["silver"])
        }
        if (studentSCC["fuchsia"].length > 0){
            answer.push(studentSCC["fuchsia"])
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


export default App;


