import * as THREE from 'three';

import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {ClearPass} from 'three/examples/jsm/postprocessing/ClearPass.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';

import TWEEN from 'tween';


function Scene (c1, c2) {

    let camera;
    let composer, renderer;

    let tweenInstance = undefined;

    function init() {

        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            window.document.addEventListener('touchmove', e => {
                if (e.scale !== 1) {
                    e.preventDefault();
                }
            }, {passive: false});
        }

        // const container = document.getElementById('container');
        const container = c1;

        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });


        renderer.outputEncoding = THREE.sRGBEncoding;

        renderer.setClearColor(0x000000, 0.0);

        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.toneMapping = THREE.ReinhardToneMapping;

        container.appendChild(renderer.domElement);

        console.log('Init canvas'); //

        const scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100);
        camera.position.set(0, 1.5, 50);
        scene.add(camera);

        function setLighting(scene){

            new RGBELoader()
                .setDataType( THREE.UnsignedByteType )
                .load( './3d/venice_sunset_1k.hdr', function ( texture ) {

                    var envMap = pmremGenerator.fromEquirectangular( texture ).texture;

                    //scene.background = envMap;
                    scene.environment = envMap;

                    texture.dispose();
                    pmremGenerator.dispose();
                })
            var pmremGenerator = new THREE.PMREMGenerator( renderer );
            pmremGenerator.compileEquirectangularShader();

        }
        setLighting(scene);



        const size = new THREE.Vector3(50, 5, 3);

        const initialZ = fitCameraToObject(
            camera,
            size,
            1.25
        );

        camera.position.set(0, 1.5, initialZ);

        const renderScene = new RenderPass(scene, camera);

        renderScene.clear = false;

        let clearPass = new ClearPass(0x000000, 0.0)

        composer = new EffectComposer(renderer);

        composer.addPass(clearPass);
        composer.addPass(renderScene);

        new GLTFLoader().load('./3d/oasis.glb', function (gltf) {

            const model = gltf.scene;

            scene.add(model);

            // const containerDiv = document.getElementById('wholeBody');
            const containerDiv = c2;


            containerDiv.addEventListener('mousemove', function (e) {
                const ratio = e.offsetX / containerDiv.clientWidth;

                const angle = 3 * (0.5 - ratio);

                const camXpos = 3.3 * Math.sin(angle);
                const camZpos = 3.3 * Math.cos(angle);
                const camYRot = 0.4 * (0.5 - ratio);

                model.position.x = camXpos;
                model.position.z = camZpos;

                model.rotation.y = camYRot;

            });


            animate();

        });
        window.addEventListener('resize', onWindowResize);


        function updateCamera(ev) {

            const zpos = initialZ - window.scrollY / 100.0;


            camera.position.z = zpos;
        }

        window.addEventListener("scroll", updateCamera, {passive: true});

    }

    const fitCameraToObject = (
        camera,
        size,
        offset,
        controls = undefined) => {

        offset = offset || 1.25;

        const center = new THREE.Vector3(0, 0, 0);

        // get the max side of the bounding box (fits to width OR height as needed )
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 4 * Math.tan(fov * 2));

        cameraZ *= offset; // zoom out a little so that objects don't fill the screen

        const minZ = 0;
        const cameraToFarEdge = (minZ < 0) ? -minZ + cameraZ : cameraZ - minZ;

        camera.far = cameraToFarEdge * 3;
        camera.updateProjectionMatrix();

        if (controls) {

            // set camera to rotate around center of loaded object
            controls.target = center;

            // prevent camera from zooming out far enough to create far plane cutoff
            controls.maxDistance = cameraToFarEdge * 2;

            controls.saveState();

        }

        return cameraZ;

    }

    function onWindowResize() {

        const width = window.innerWidth;
        const height = window.innerHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
        composer.setSize(width, height);

    }

    function animate() {

        requestAnimationFrame(animate);

        composer.render();

        if (tweenInstance !== undefined) {
            TWEEN.update();
        }

    }

    init();

}

Scene(document.getElementById('model-container'), document.body)
