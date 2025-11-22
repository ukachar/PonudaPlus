import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const Login = () => {
  const [info, setInfo] = useState({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  useEffect(() => {
    const getInfo = async () => {
      const response = await fetch("./info.json");
      const data = await response.json();
      setInfo(data);
    };
    getInfo();
  }, []);

  return (
    <div>
      <div className="min-h-screen bg-gray-100 text-gray-900 flex justify-center">
        <div className="max-w-screen-xl m-0 sm:m-10 bg-white shadow sm:rounded-lg flex justify-center flex-1">
          <div className="lg:w-1/2 xl:w-5/12 p-6 sm:p-12 relative">
            <div className="flex items-center w-full flex-col">
              <img src="logo_inverted.png" alt="Logo" width={"40%"} />
              <h2 className="text-8xl font-bold text-orange-400 text-center">
                Ponuda+
              </h2>
            </div>

            <div className="mt-24 flex flex-col items-center ">
              <h1 className="text-2xl xl:text-3xl font-extrabold">
                Prijavi se
              </h1>

              <div className="w-full flex-1 mt-8">
                <div className="mx-auto max-w-xs">
                  <form onSubmit={handleSubmit}>
                    <input
                      className="w-full px-8 py-4 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white"
                      type="email"
                      id="login_mail"
                      placeholder="Email"
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                      className="w-full px-8 py-4 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white mt-5"
                      type="password"
                      id="login_password"
                      placeholder="Lozinka"
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="submit"
                      id="login_submit"
                      className="mt-5 tracking-wide font-semibold bg-indigo-500 text-gray-100 w-full py-4 rounded-lg hover:bg-indigo-700 transition-all duration-300 ease-in-out flex items-center justify-center focus:shadow-outline focus:outline-none"
                    >
                      Prijava
                    </button>
                  </form>
                </div>
              </div>
              <p className=" p-2 absolute bottom-0 font-bold uppercase text-center">
                {info.name}
              </p>
            </div>
          </div>
          <div className="flex-1 bg-indigo-100 text-center hidden lg:flex">
            <div className="m-12 xl:m-16 w-full bg-contain bg-center bg-no-repeat rounded-sm">
              <img src="./login_banner.jpg" alt="login banner" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
