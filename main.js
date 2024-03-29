const { mat4 } = glMatrix;
const toRad = glMatrix.glMatrix.toRadian;

const shapes = [];
const lines = [];
let gl = null;

let localCoordinateSystem = null;
let moveCamera = null;


const locations = {
    attributes: {
        vertexLocation: null,
        colorLocation: null
    }, uniforms: {
        modelViewMatrix: null,
        projectionMatrix: null,
    }
}

const viewMatrix = mat4.create();

window.onload = async () => {

    /* --------- basic setup --------- */
    let canvas = document.getElementById("canvas");
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    const mouseControl = new MouseControl(canvas);
    const keyboardControl = new KeyboardControl(window);

    gl.enable(gl.DEPTH_TEST);
    gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
    gl.clearColor(0.729, 0.764, 0.674, 1);

    const program = createShaderProgram("v-shader", "f-shader");
    gl.useProgram(program);

    /* --------- save attribute & uniform locations --------- */
    locations.attributes.vertexLocation = gl.getAttribLocation(program, "vertexPosition");
    locations.attributes.colorLocation = gl.getAttribLocation(program, "vertexColor");
    locations.uniforms.modelViewMatrix = gl.getUniformLocation(program, "modelViewMatrix");
    locations.uniforms.scalingMatrix = gl.getUniformLocation(program, "scalingMatrix");
    locations.uniforms.projectionMatrix = gl.getUniformLocation(program, "projectionMatrix");

    /* --------- create & send projection matrix --------- */
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, toRad(45), canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    gl.uniformMatrix4fv(locations.uniforms.projectionMatrix, gl.FALSE, projectionMatrix);

    /* --------- create view matrix --------- */
    mat4.lookAt(viewMatrix, [0, 0, 3], [0, 0, 0], [0, 1, 0]);

    /* Position for each shape */
    const positions = [
        [-0.95, 0.7, 0], [0, 0.7, 0], [0.95, 0.7, 0],
        [-0.95, 0, 0], [0, 0, 0], [0.95, 0, 0],
        [-0.95, -0.7, 0], [0, -0.7, 0], [0.95, -0.7, 0]
    ];

    /* --------- load obj files --------- */
    const teapotFile = await fetch("/sampleModels/teapot.obj").then(response => response.text());
    const bunnyFile = await fetch("/sampleModels/bunny.obj").then(response => response.text());
    const tetrahedronFile = await fetch("/sampleModels/tetrahedron.obj").then(response => response.text());

    /* --------- Create Shapes --------- */
    shapes.push(parseAndCreateShape(teapotFile));
    shapes.push(createShape());
    shapes.push(createShape());
    shapes.push(createShape());
    shapes.push(parseAndCreateShape(tetrahedronFile));
    shapes.push(createShape());
    shapes.push(createShape());
    shapes.push(createShape());
    shapes.push(parseAndCreateShape(bunnyFile));

    shapes.forEach((shape, index) => {
        shape.translate(positions[index]);
    });

    lines.push(createCoordinateSystem());
    lines[0].scale([20, 20, 20]);

    localCoordinateSystem = createCoordinateSystem();

    /* --------- Load some data from external files - only works with an http server --------- */
    //  await loadSomething();

    /* --------- start render loop --------- */
    requestAnimationFrame(render);
}

moveCamera = function translateCamera(vector) {
    mat4.translate(viewMatrix, viewMatrix, vector);
}

/* --------- simple example of loading external files --------- */
async function loadSomething() {
    const data = await fetch('helpers.js').then(result => result.text());
    console.log(data);
}

let then = 0;

function render(now) {
    /* --------- calculate time per frame in seconds --------- */
    let delta = now - then;
    delta *= 0.001;
    then = now;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    shapes.forEach(shape => {
        shape.draw();
    });

    lines.forEach(lines => {
        lines.drawLine();
    });

    requestAnimationFrame(render)
}


function createShape() {
    /* --------- define vertex positions & colors --------- */
    /* -------------- 3 vertices per triangle ------------- */
    const vertices = [
        // X, Y, Z, W
        0.2, 0.2, 0.2, 1,
        -0.2, 0.2, 0.2, 1,
        0.2, -0.2, 0.2, 1,

        -0.2, 0.2, 0.2, 1,
        -0.2, -0.2, 0.2, 1,
        0.2, -0.2, 0.2, 1, // front face end

        -0.2, -0.2, -0.2, 1,
        -0.2, -0.2, 0.2, 1,
        -0.2, 0.2, 0.2, 1,

        -0.2, -0.2, -0.2, 1,
        -0.2, 0.2, 0.2, 1,
        -0.2, 0.2, -0.2, 1, // left face end

        0.2, 0.2, -0.2, 1,
        -0.2, -0.2, -0.2, 1,
        -0.2, 0.2, -0.2, 1,

        0.2, 0.2, -0.2, 1,
        0.2, -0.2, -0.2, 1,
        -0.2, -0.2, -0.2, 1, // back face end

        0.2, -0.2, 0.2, 1,
        -0.2, -0.2, -0.2, 1,
        0.2, -0.2, -0.2, 1,

        0.2, -0.2, 0.2, 1,
        -0.2, -0.2, 0.2, 1,
        -0.2, -0.2, -0.2, 1, // bottom face end

        0.2, 0.2, 0.2, 1,
        0.2, -0.2, -0.2, 1,
        0.2, 0.2, -0.2, 1,

        0.2, -0.2, -0.2, 1,
        0.2, 0.2, 0.2, 1,
        0.2, -0.2, 0.2, 1, // right face end

        0.2, 0.2, 0.2, 1,
        0.2, 0.2, -0.2, 1,
        -0.2, 0.2, -0.2, 1,

        0.2, 0.2, 0.2, 1,
        -0.2, 0.2, -0.2, 1,
        -0.2, 0.2, 0.2, 1, // Top face end
    ];

    const colorData = [
        [0.0, 0.0, 0.0, 1.0],    // Front face: black
        [1.0, 0.0, 0.0, 1.0],    // left face: red
        [0.0, 1.0, 0.0, 1.0],    // back face: green
        [0.0, 0.0, 1.0, 1.0],    // Bottom face: blue
        [1.0, 1.0, 0.0, 1.0],    // Right face: yellow
        [1.0, 0.0, 1.0, 1.0],    // top face: purple
    ];

    const colors = [];

    /* --------- add one color per face, so 6 times for each color --------- */
    colorData.forEach(color => {
        for (let i = 0; i < 6; ++i) {
            colors.push(color);
        }
    });

    /* --------- create shape object and initialize data --------- */
    const cube = new Shape();
    cube.initData(vertices, colors)

    return cube;
}

function createCoordinateSystem() {
    /* --------- define vertex positions & colors --------- */
    /* -------------- 2 vertices per line ------------- */
    const vertices = [
        // X, Y, Z, W
        -0.5, 0.0, 0.0, 1.0,   // X-Start
        0.5, 0.0, 0.0, 1.0,    // X-End
        0.0, 0.5, 0.0, 1.0,    // Y-Start
        0.0, -0.5, 0.0, 1.0,   // Y-End
        0.0, 0.0, 0.5, 1.0,    // Z-Start
        0.0, -0.0, -0.5, 1.0,  // Z-End
    ];

    const colorData = [
        [1.0, 0.0, 0.0, 1.0],    // X
        [0.0, 1.0, 0.0, 1.0],    // Y
        [0.0, 0.0, 1.0, 1.0],    // Z
    ];

    const colors = [];

    /* --------- add one color for each point --> 2 for each line --------- */
    colorData.forEach(color => {
        for (let i = 0; i < 2; ++i) {
            colors.push(color);
        }
    });

    /* --------- create shape object and initialize data --------- */
    const globalCoordinateSystemLines = new Shape();
    globalCoordinateSystemLines.initData(vertices, colors)

    return globalCoordinateSystemLines;
}

function parseAndCreateShape(objFile) {
    const objParser = new OBJParser();
    const parsedShape = objParser.extractData(objFile)

    const colors = [];

    for(let i = 0; i < parsedShape.vertices.length; i++){
        colors.push([Math.random(), Math.random(), Math.random(), 1]);
    }

    /* --------- create shape object and initialize data --------- */
    const shape = new Shape();
    shape.initData(parsedShape.vertices, colors, parsedShape.indices);

    return shape;
}

