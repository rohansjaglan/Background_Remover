import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { createContext, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";
import axiosInstance from "../lib/axios"; // ✅ use this instead of raw axios

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const navigate = useNavigate();
  const [image, setImage] = useState(false);
  const [resultImage, setResultImage] = useState(false);
  const [credit, setCredit] = useState(false);

  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();

  const loadCreditsData = async () => {
    try {
      const token = await getToken();
      const { data } = await axiosInstance.get("/api/user/credits", {
        headers: { token },
      });

      if (data.success) {
        setCredit(data.credits);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to load credits");
    }
  };

  const removeBG = async (image) => {
    try {
      if (!isSignedIn) {
        return openSignIn();
      }

      setResultImage(false);
      setImage(image);
      navigate("/result");

      const token = await getToken();
      const formData = new FormData();
      formData.append("image", image);

      const { data } = await axiosInstance.post(
        "/api/image/remove-bg",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            token,
          },
        }
      );

      if (data.success) {
        setResultImage(data.resultImage);
        if (data.creditBalance !== undefined) {
          setCredit(data.creditBalance);
        }
      } else {
        toast.error(data.message || "Background removal failed");
        if (data.creditBalance !== undefined) {
          setCredit(data.creditBalance);
        }
        if (data.creditBalance === 0) {
          navigate("/buy");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Something went wrong");
    }
  };

  const value = {
    image,
    setImage,
    removeBG,
    loadCreditsData,
    resultImage,
    setResultImage,
    credit,
  };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
