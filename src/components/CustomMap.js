import React, {useState, useRef} from 'react'
import { GoogleMap, Polyline, Marker, InfoWindow } from '@react-google-maps/api';
import * as loc_data from '../data/location.json';
import moment from "moment";

let pathdata = [];
loc_data.default.map((val)=>{
    pathdata.push({
        lat: val.loc.coordinates[0], lng:val.loc.coordinates[1], timestamp: val.timestamp, hd: val.hd, sp: val.sp
   })
});
const car = "M17.402,0H5.643C2.526,0,0,3.467,0,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644 V6.584C23.044,3.467,20.518,0,17.402,0z M22.057,14.188v11.665l-2.729,0.351v-4.806L22.057,14.188z M20.625,10.773 c-1.016,3.9-2.219,8.51-2.219,8.51H4.638l-2.222-8.51C2.417,10.773,11.3,7.755,20.625,10.773z M3.748,21.713v4.492l-2.73-0.349 V14.502L3.748,21.713z M1.018,37.938V27.579l2.73,0.343v8.196L1.018,37.938z M2.575,40.882l2.218-3.336h13.771l2.219,3.336H2.575z M19.328,35.805v-7.872l2.729-0.355v10.048L19.328,35.805z";

const CustomMap = () => {
    // Polyline and Map Refs
    const polylineRef = useRef();
    const mapRef = useRef();

    // States
    const [timer, setTimer] = useState(null);
    const [currentPath, setCurrentPath] = useState([pathdata[0]]);
    const [speed, setSpeed] = useState(1);
    const [timePerStep, setTimePerStep] = useState(15);
    const [BtnName, setBtnName] = useState('Play');

    //Current Position to help track Marker and InfoWindow
    let currentPosition = currentPath[currentPath.length - 2] || pathdata[0];

    //Styles
    const mapContainerStyle = {
        height: "700px",
        width: "100%"
    };
    // Marker
    let icon = {
        path: car,
        scale: .7,
        strokeColor: 'white',
        strokeWeight: .10,
        fillOpacity: 1,
        fillColor: '#fff',
        offset: '5%',
        rotation: currentPosition && currentPosition.hd ? currentPosition.hd : 0,
        anchor: window.google ? new window.google.maps.Point(10, 25) : null,
    }

    //Polyline Options
    const options = {
        strokeColor: "#FF0000",
        strokeOpacity: 0.7,
        strokeWeight: 2,
        geodesic: true, //set to false if you want straight line instead of arc
        zIndex: 1
    };

    const recursiveAnimate = (index) => {
        let step = 0;
        let numSteps = 100;
        let timer = InvervalTimer(function(arg) {
            step += speed;
            if (step > numSteps) {
                step = 0;
                timer.cancel();
                if (index < pathdata.length - 2) {
                    recursiveAnimate(index + 1)
                }
            } else {
                let currentPolyLine = polylineRef.current && polylineRef.current.props ? polylineRef.current.props.path: null;
                let nextPolyline = pathdata[index+1];
                if(currentPolyLine != null) {
                    setCurrentPath([...currentPolyLine, nextPolyline]);
                }
            }
        }, timePerStep);
        setTimer(timer);
    };

    function InvervalTimer(callback, interval, arg) {
        let timerId, startTime, remaining = 0;
        let state = 0; //  0 = idle, 1 = running, 2 = paused, 3= resumed
        let timeoutId
        const pause = function() {
            if (state != 1) return;
            remaining = interval - (new Date() - startTime);
            window.clearInterval(timerId);
            state = 2;
        };

        const resume = function() {
            if (state != 2) return;
            state = 3;
            timeoutId = window.setTimeout(this.timeoutCallback, remaining, arg);
        };

        const timeoutCallback = function(timer) {
            if (state != 3) return;
            clearTimeout(timeoutId);
            startTime = new Date();
            timerId = window.setInterval(function() {
                callback(arg)
            }, interval);
            state = 1;
        };

        const cancel = function() {
            clearInterval(timerId)
        };

        startTime = new Date();
        timerId = window.setInterval(function() {
            callback(arg)
        }, interval);
        state = 1;

        return {
            cancel: cancel,
            pause: pause,
            resume: resume,
            timeoutCallback: timeoutCallback
        };
    }

    return (
        <>
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={currentPosition}
                zoom={12}
                ref={mapRef}
            >
                <Polyline
                    ref={polylineRef}
                    path={currentPath}
                    options={options}
                />
                <Marker
                    position={currentPosition}
                    icon={icon}
                />
                <InfoWindow
                    options={{pixelOffset: new window.google.maps.Size(0,-30)}}
                    position={currentPosition}
                >
                    <div id="iw-container">
                        <div className="iw-title">MH 12 HB 1234</div>
                        <div className="iw-content">
                            <table>
                                <tbody>
                                    <tr>
                                        <th>Speed</th>
                                        <tr>{currentPosition.sp ? currentPosition.sp : 0 } km/hr</tr>
                                    </tr>
                                    <tr>
                                        <th>Date</th>
                                        <tr>{moment(currentPosition.timestamp).format('DD MMMM YYYY   HH:mm')}</tr>
                                    </tr>
                                    <tr>
                                        <th>Latitude</th>
                                        <tr>{currentPosition.lat ? currentPosition.lat : 0 }</tr>
                                    </tr>
                                    <tr>
                                        <th>Longitude</th>
                                        <tr>{currentPosition.lng ? currentPosition.lng : 0 }</tr>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </InfoWindow>
            </GoogleMap>
            <button
                onClick={() => {
                    if (!timer) {
                        recursiveAnimate(0)
                        setBtnName('Pause');
                    } else if (BtnName == 'Pause'){
                        timer && timer.pause();
                        setBtnName('Resume');
                    } else {
                        setBtnName('Pause');
                        timer.resume();
                    }
                }}
            >{BtnName}</button>
        </>
    )
};

export default React.memo(CustomMap)