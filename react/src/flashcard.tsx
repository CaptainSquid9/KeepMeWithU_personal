import React, { useState, useEffect } from "react";
import "./flashcard.css";
import axios from "axios";

type ValuesObject = {
  [key: string]: number; // This allows indexing with numbers
};
type BoolsObject = {
  [key: string]: boolean; // This allows indexing with numbers
};
type StringObject = {
  [key: string]: string; // This allows indexing with numbers
};
var CounterOut: ValuesObject;
var LoadedInternal = -1;
function flashCard() {
  var Time: number;
  var photoData: Array<string>;
  Time = new Date().getHours();

  var Timer: NodeJS.Timeout | undefined;
  var [IdleTimer, setIdleTimer] = useState<NodeJS.Timeout | undefined>();
  const [LoadedPictures, setLoadedPictures] = useState<number>(0);
  //position for each layer
  //Amount of layers to generate
  const Layers: number = 10;
  //Sent from picker
  //X
  const [divX, setDivX] = useState<ValuesObject>({});

  //Y
  const [divY, setDivY] = useState<ValuesObject>({});

  const [MouseDownBool, setMDBool] = useState<boolean>(false);
  const [Allow, setAllow] = useState<boolean>(false);
  var AllowSlide = false;
  var start_check = false;
  //Bool checking if swiped for each layer
  const [SwipedBool, setSwipedBool] = useState<BoolsObject>({});
  //Z-index counter for each layer
  const [Counter, setCounter] = useState<ValuesObject>({});

  const setCounterOut = setCounter;

  // Fetch random photo for each layer
  const [photoUrl, setPhotoUrl] = useState<StringObject>({});

  function Start(elem: number) {
    // if (Time > 8 && Time < 22) {
    setLoadedPictures(LoadedPictures + 1);
    LoadedInternal += 1;
    //console.log(`Loaded pictures: ${LoadedPictures}, ${LoadedInternal}`);
    if (LoadedInternal == Layers - 1) {
      setAllow(true);
      AllowSlide = true;
      Timer = setTimeout(() => {
        Swipe(0, false);
      }, 1000);
      setIdleTimer(Timer);
      //  console.log("Done");
    } else if (LoadedPictures < Layers || LoadedInternal < Layers) {
      let strElem = elem.toString();
      //console.log("positioning");
      //Set default
      setDivX((prevState) => ({
        ...prevState,
        [strElem]: window.innerWidth / 2,
      }));
      setDivY((prevState) => ({
        ...prevState,
        [strElem]: window.innerHeight / 2,
      }));
      setSwipedBool((prevState) => ({ ...prevState, [strElem]: false }));
      setCounterOut((prevState) => ({
        ...prevState,
        [strElem]: 214748364 - elem,
      }));
      CounterOut = { ...CounterOut, [strElem]: 214748364 - elem };
      // All images have been loaded: ALlow touch
    }
    //  }
  }

  //Random photo
  // Called by every layer
  const fetchPhoto = async () => {
    axios.get("/api/randomPhoto").then((response) => {
      photoData = response.data;
      for (var i = 0; i < Layers; i++) {
        // Convert the ArrayBuffer to a Blob
        getRandomPhotoS(i);
      }
      photoData;
    });
  };

  //Get random photo start
  const getRandomPhotoS = async (id: number) => {
    //console.log(folderId);
    //if (Time > 10 && Time < 21) {

    setPhotoUrl((prevState) => ({
      ...prevState,
      [id.toString()]: photoData[id].toString(),
    }));
  };

  useEffect(() => {
    if (start_check == false) {
      start_check = true;
      fetchPhoto();
      for (var i = 0; i < Layers; i++) {
        Start(i);
      }
    }
  }, []);
  //Swipe animations
  function Swipe(id: number, update: boolean) {
    if ((AllowSlide == true || Allow == true) && update == false) {
      var SlideInterval: NodeJS.Timeout;
      const StrID = id.toString();

      setAllow(false);
      AllowSlide = false;
      setSwipedBool((prevState) => ({ ...prevState, [StrID]: true }));

      Timer = setTimeout(() => {
        console.log("Running timer");
        if (id == 9) {
          Swipe(0, false);
        } else {
          Swipe(id + 1, false);
        }
      }, 15000);

      setIdleTimer(Timer);
      //Once animation is done
      setTimeout(() => {
        setAllow(true);
        AllowSlide = true;
        clearInterval(SlideInterval);
        setSwipedBool((prevState) => ({ ...prevState, [StrID]: false }));
        setCounterOut((prevState) => ({
          ...prevState,
          [StrID]: CounterOut[id] - Layers,
        }));
        CounterOut[id] = CounterOut[id] - Layers;
      }, 1000);
      console.log(`Updated: ${CounterOut[id]}`);
      // console.log(`Updated: ${CounterOut[id]}`);
    }
  }

  return (
    <div className="body">
      {[...Array(Layers)].map((Layer, i) => {
        return (
          <div
            id={i.toString()}
            className={`flashCardDiv ${SwipedBool[i] ? "FadeOut" : ""}`}
            onMouseDown={() => {
              setMDBool(true),
                clearTimeout(IdleTimer),
                clearTimeout(Timer),
                console.log("Mouse down");
            }}
            onMouseUp={() => {
              setMDBool(false), Swipe(i, false), console.log("Mouse up");
            }}
            style={{ top: divY[i], left: divX[i], zIndex: Counter[i] }}
          >
            <div
              style={{
                backgroundImage: `url(${photoUrl[i]})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
                filter: "blur(8px)",
                width: "100%",
                height: "100%",
              }}
            ></div>
            <img
              src={photoUrl[i]}
              width={window.innerWidth}
              height={window.innerHeight}
              draggable="false"
              onChange={() => {
                Swipe(i, true);
              }}
            ></img>
          </div>
        );
      })}
    </div>
  );
}

export default flashCard;
