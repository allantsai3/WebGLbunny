var canvas;
var gl;
var vertices = [];
var newIndices = [];

var vBuffer;
var vPositionLoc;
var vNormalLoc;

var plightvBuffer;
var plightiBuffer;
var sLightvBuffer;
var sLightiBuffer;

var color = []
var translation = 0;
var theta_x = 0;
var theta_y = 0;
var theta_z = 0;
var dx = 0;
var dy = 0;
var dz = 0;
var scaling = 0;

var bunAmbient;
var bunDiffuse;
var bunSpecular;

var origPointLightPosition;
var pointLightPosition;
var pointLightAmbient;
var pointLightDiffuse;
var pointLightSpecular;

var pointAmbientProduct;
var pointDiffuseProduct;
var pointSpecularProduct;

var spotAmbientProduct;
var spotDiffuseProduct;
var spotSpecularProduct;

var cameraMatrix;

var nBuffer;
var vertexNormals = [];

var test;
var test1;
var test2;
var test3;
var count = 0;

var bunnymodel;
var pLightModel;
var plighttranslate;

var pointingAt;

var pointLightToggle = true;
var spotLightToggle = true;


var boxVertices = [ 
    // X, Y, Z vertices
    // Top
    vec3(1.0, 1.0, 1.0),
    vec3(-1.0, 1.0, 1.0),
    vec3(-1.0, -1.0, 1.0),
    vec3(1.0, -1.0, 1.0),
    vec3(1.0, 1.0, -1.0),
    vec3(-1.0, 1.0, -1.0),
    vec3(-1.0, -1.0, -1.0),
    vec3(1.0, -1.0, -1.0),

];

var boxIndices = [
    vec2(0, 1),
    vec2(1, 2),
    vec2(2, 3), 
    vec2(3, 0), 
    vec2(0, 4),
    vec2(4, 5),
    vec2(5, 6),
    vec2(6, 7),
    vec2(7, 4),
    vec2(7, 3),
    vec2(5, 1),
    vec2(6, 2)

];

var coneVertices = [];
var coneIndices = [];


window.addEventListener("keydown", getKeyPress, false);
window.addEventListener("keyup", getKeyRelease, false);
window.addEventListener("mousedown", mousePress, false);
window.addEventListener("mouseup", mouseRelease, false);

var pressed_p = false;
var pressed_s = false;
var globalz = 0.0;
var globalx = 0.0;
var globaly = 0.0;

function getKeyPress(key){
    if(key.key == "ArrowUp"){ //change to right mouse button + mouse movement
        dz = -0.02;
        globalz += dz;
    }
    if(key.key == "ArrowDown"){ //change to right mouse button + mouse movement
        dz = 0.02;
        globalz += dz;
    }
    if(key.key == "r"){
        bunnymodel = mat4();
    }
    if(key.key == "p"){
        if (pressed_p == false){
            pointLightToggle = !pointLightToggle;
            pressed_p = true;
        }
    }
    if(key.key == "s"){
        if (pressed_s == false){
            spotLightToggle = !spotLightToggle;
            pressed_s = true;
        }
    }
}

var translate_location = [0, 0];
var rotation = [0, 0];

function mousePress(e){
    if (e.which == 1) {
        translate_location[0] = e.pageX;
        translate_location[1] = e.pageY;
    }

    if (e.which == 3) {
        rotation[0] = e.pageX;
        rotation[1] = e.pageY;
    }
}


var deltaX;
var deltaY;
var rot;
var tempMatrix;
function mouseRelease(e){
    if (e.which == 1) {
        dx = (e.pageX - translate_location[0]) / 400;
        dy = (e.pageY - translate_location[1]) / 400;

        globalx += dx;
        globaly -= dy;
        translation = translate(dx, -dy, 0);
        bunnymodel = mult(translation, bunnymodel);
    }
    if (e.which == 3) {
        theta_y = (e.pageX - rotation[0]) * 10.0;
        theta_x = (e.pageY - rotation[1]) * 10.0;

        r_x = rotate(radians(theta_x), 1, 0, 0);
        r_y = rotate(radians(theta_y), 0, 1, 0);
        rot = mult(r_x, r_y);

        bunnymodel = mult(translate(-globalx, -globaly, -globalz), bunnymodel);
        bunnymodel = mult(rot, bunnymodel);
        bunnymodel = mult(translate(globalx, globaly, globalz), bunnymodel);
    }
}

function getKeyRelease(key){
    if (key.key == "p"){
        pressed_p = false;
    }
    if (key.key == "s"){
        pressed_s = false;
    }
    if(key.key == "ArrowUp" || key.key == "ArrowDown"){
        dz = 0;
    }
}

window.onload = function init() { 

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
    gl.enable(gl.DEPTH_TEST);

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    vertices = get_vertices();
    indices = get_faces();

    var eye = vec3(0.0, 0.0, 10.0);
    var at = vec3(0.0, 0.0, 0.0);
    var up = vec3(0.0, 1.0, 0.0);
    cameraMatrix = lookAt(eye, at, up);

    //Send in the view matrix once
    viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
    gl.uniformMatrix4fv( viewMatrixLoc, false, flatten(cameraMatrix));

    var fovy = 60; //field of fiew angle
    var aspect  = canvas.width / canvas.height;
    var near = 0.1;
    var far = 1000.0;
    var projectionmatrix = perspective(fovy, aspect, near, far);

    //Send in the projection matrix once
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionmatrix));

    //Declare location for other uniforms
    modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix")
    normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");

    //-----------------------BUNNY--------------------------------
    bunnymodel = mat4();

    for (var i=0; i<indices.length; i++){
        newIndices.push(vec3(indices[i][0]-1, indices[i][1]-1, indices[i][2]-1));
    };

    //Configuring the vertex buffer
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    vPositionLoc = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer( vPositionLoc, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPositionLoc );

    iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatten(newIndices)), gl.STATIC_DRAW);


    bunAmbient = vec4( 0.83, 0.69, 0.22, 1.0);
    bunDiffuse = vec4( 1.0, 0.87, 0.0, 1.0);
    bunSpecular = vec4( 1.0, 1,0, 1.0, 1.0);
    var bunShininess = 40.0;

    gl.uniform1f(gl.getUniformLocation(program, "shininess"), bunShininess);


    //------------------------Point light--------------------------------
         //Setting point light RGBA
    origPointLightPosition = vec4(5.0, 5.0, 0.0, 0.0);
    pointLightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
    pointLightDiffuse = vec4(0.5, 0.5, 0.5, 1.0);
    pointLightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
    pointLightPosition = origPointLightPosition;

    pLightModel = mat4();
    //Transform plight
    plighttranslate = translate(vec3(pointLightPosition));
    pLightModel = mult(scalem(0.2, 0.2, 0.2), pLightModel);
    pLightModel = mult(plighttranslate, pLightModel);

    plightvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, plightvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(boxVertices), gl.STATIC_DRAW);

    plightiBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, plightiBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(flatten(boxIndices)), gl.STATIC_DRAW);

    //----------------------Spot light------------------------------
    spotLightPosition = vec4(0.0, 4.0, 2.0, 1.0);
    spotLightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
    spotLightDiffuse = vec4(0.2, 0.2, 0.2, 1.0);
    spotLightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

    //Generate the the circular base
    for (var i=0; i<360; i+=10){
        coneVertices.push(vec3(Math.cos(radians(i)), -1.0, Math.sin(radians(i))));
    }
    coneVertices.push(vec3(0.0, 1.0, 0.0));

    for (var i=0; i<coneVertices.length-1; i++){
        coneIndices.push(vec2(i, coneVertices.length));
    }

    for (var i=0; i<coneVertices.length-2; i++){
        coneIndices.push(vec2(i, i+1));
    }

    sLightModel = mat4();
    sLightTranslate = translate(vec3(spotLightPosition));
    sLightModel = mult(scalem(0.3, 0.8, 0.3), sLightModel);
    sLightModel = mult(sLightTranslate, sLightModel);

    sLightvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sLightvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(coneVertices), gl.STATIC_DRAW);

    sLightiBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sLightiBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(flatten(coneIndices)), gl.STATIC_DRAW);

    gl.vertexAttribPointer( vPositionLoc, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPositionLoc );

    slightmodel = mat4();
    var cutoff = radians(30);
    pointingAt = vec3(0.0, 0.0, 0.0);

    var attenuation = 1;

    gl.uniform1f(gl.getUniformLocation(program, "cutoff"), Math.cos(cutoff));
    gl.uniform3fv(gl.getUniformLocation(program, "spotLightPointAt"), flatten(pointingAt));
    gl.uniform1f(gl.getUniformLocation(program, "attenuation"), attenuation);


    //----------------------Surface normals-------------------------
     //Calculate normal of each face
    for (var i=0; i< vertices.length; i++){
        vertexNormals.push(vec3(0.0, 0.0, 0.0));
    }

    var v1;
    var v2;
    var p1;
    var p2;
    var p3;
    var n;

    //calculate and add to vertexnormal for each face
    for (var j=0; j< newIndices.length; j++){
        p1 = vertices[newIndices[j][0]];
        p2 = vertices[newIndices[j][1]];
        p3 = vertices[newIndices[j][2]];

        v1 = subtract(p2, p1);
        v2 = subtract(p3, p1);
        n = cross(v1, v2);

        vertexNormals[newIndices[j][0]] = add(vertexNormals[newIndices[j][0]], n);
        vertexNormals[newIndices[j][1]] = add(vertexNormals[newIndices[j][1]], n);
        vertexNormals[newIndices[j][2]] = add(vertexNormals[newIndices[j][2]], n);
    }

    for (var j=0; j< vertexNormals.length; j++){
        vertexNormals[j] = normalize(vertexNormals[j])
    }


    nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexNormals), gl.STATIC_DRAW);
    vNormalLoc = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer( vNormalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( vNormalLoc);

    //----------------------------------------------------------------

    render();
}
var pointTheta = 0;
var spotTheta = 0;
var computedNormalMatrix = mat3();
function render() {

    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 

    translation = translate(0, 0, dz);
    bunnymodel = mult(translation, bunnymodel);

    //DRAW BUNNY
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.vertexAttribPointer( vPositionLoc, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPositionLoc );

    computedNormalMatrix = normalMatrix(bunnymodel, true);
    gl.uniformMatrix3fv( normalMatrixLoc, false, flatten(computedNormalMatrix));

    gl.uniformMatrix4fv( modelMatrixLoc, false, flatten(bunnymodel));
    gl.drawElements( gl.TRIANGLES, flatten(indices).length, gl.UNSIGNED_SHORT, 0);

    //POINT LIGHT PARAMS
    pointAmbientProduct = mult(pointLightAmbient, bunAmbient);
    pointDiffuseProduct = mult(pointLightDiffuse, bunDiffuse);
    pointSpecularProduct = mult(pointLightSpecular, bunSpecular);

    gl.uniform4fv(gl.getUniformLocation(program, "pointAmbientProduct"), flatten(pointAmbientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "pointDiffuseProduct"), flatten(pointDiffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "pointSpecularProduct"), flatten(pointSpecularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "pointLightPosition"), flatten(pointLightPosition));

    //SPOT LIGHT params
    spotAmbientProduct = mult(spotLightAmbient, bunAmbient);
    spotDiffuseProduct = mult(spotLightDiffuse, bunDiffuse);
    spotSpecularProduct = mult(spotLightSpecular, bunSpecular);
    gl.uniform4fv(gl.getUniformLocation(program, "spotAmbientProduct"), flatten(spotAmbientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "spotDiffuseProduct"), flatten(spotDiffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "spotSpecularProduct"), flatten(spotSpecularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "spotLightPosition"), flatten(spotLightPosition));


    //DRAW POINT LIGHT
    if (pointLightToggle){
        pointTheta += 1;
    }

    if (pointTheta == 360){
        pointTheta = 0;
    }
    pointLightPosition = vec4(origPointLightPosition[0]*Math.cos(radians(pointTheta)), 5.0, -5.0*Math.sin(radians(pointTheta)), 1.0);
    pLightModel = mat4();
    //Transform plight
    plighttranslate = translate(vec3(pointLightPosition));
    pLightModel = mult(scalem(0.2, 0.2, 0.2), pLightModel);
    pLightModel = mult(plighttranslate, pLightModel);


    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, plightiBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, plightvBuffer);
    gl.vertexAttribPointer( vPositionLoc, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPositionLoc );

    computedNormalMatrix = normalMatrix(pLightModel, true);
    gl.uniformMatrix3fv( normalMatrixLoc, false, flatten(computedNormalMatrix));
    gl.uniformMatrix4fv( modelMatrixLoc, false, flatten(pLightModel));
    gl.drawElements( gl.LINES, flatten(boxIndices).length, gl.UNSIGNED_BYTE, 0);

    //DRAW SPOT LIGHT
    if (spotLightToggle){
        spotTheta += 1;
    }

    if (spotTheta == 360){
        spotTheta = 0;
    }
    var spotLightRotation = 5.0*Math.sin(radians(spotTheta));
    pointingAt = vec3(spotLightRotation, 0.0, 0.0);
    sLightModel = mat4();
    var rotateSpotLight = rotate(10.0*spotLightRotation, 0, 0, 1); //Rotate along z axis
    sLightModel = mult(rotateSpotLight, sLightModel);
    sLightTranslate = translate(vec3(spotLightPosition));
    sLightModel = mult(scalem(0.3, 0.8, 0.3), sLightModel);

    sLightModel = mult(sLightTranslate, sLightModel);

    gl.uniform3fv(gl.getUniformLocation(program, "spotLightPointAt"), flatten(pointingAt));

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sLightiBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, sLightvBuffer);
    gl.vertexAttribPointer( vPositionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( vPositionLoc);

    gl.uniformMatrix4fv( modelMatrixLoc, false, flatten(sLightModel));
    gl.drawElements( gl.LINES, flatten(coneIndices).length, gl.UNSIGNED_BYTE, 0);


	window.requestAnimFrame(render);
}