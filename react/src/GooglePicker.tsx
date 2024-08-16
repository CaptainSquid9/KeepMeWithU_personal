import React, { useEffect } from "react";
import useDrivePicker from "react-google-drive-picker";
import { useNavigate } from "react-router-dom";
import { AES } from "crypto-js";

var folderId: string | undefined;
var Auth: string;
function Picker() {
  const [openPicker, authResponse] = useDrivePicker();
  const navigate = useNavigate();

  // const customViewsArray = [new google.picker.DocsView()]; // custom view
  const handleOpenPicker = () => {
    openPicker({
      clientId: import.meta.env.VITE_ENVIRONMENT_GOOGLE_CLIENTID,
      developerKey: import.meta.env.VITE_ENVIRONMENT_API,
      viewId: "DOCS_IMAGES",
      // token: token, // pass oauth token in case you already have one
      showUploadView: true,
      showUploadFolders: true,
      supportDrives: true,
      multiselect: false,
      setIncludeFolders: true,
      setSelectFolderEnabled: true,

      // customViews: customViewsArray, // custom view
      callbackFunction: (data) => {
        if (data.action === "cancel") {
          // console.log("User clicked cancel/close button");
          return null;
        }
        if (data.docs[0].id) {
          folderId = data.docs[0].id;
          //  console.log(folderId);

          navigate(`/display/${folderId}/${Auth}`);
        }
      },
    });
  };

  useEffect(() => {
    if (authResponse) {
      Auth = encodeURIComponent(
        AES.encrypt(authResponse.access_token, "TEST!NGPURP=S3S").toString()
      );
    }
  }, [authResponse]);

  return (
    <div>
      <h1>Use the google credentials from the hackathon project description</h1>
      <button onClick={() => handleOpenPicker()}>Open Picker</button>
    </div>
  );
}

export { Picker, Auth };
