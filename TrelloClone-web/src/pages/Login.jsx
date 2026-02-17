import axios from "axios";
import React from "react";
import { useState } from "react";
import { BASE_URL } from "../utils/constants";
import { useNavigate } from "react-router-dom";


const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail ] = useState('deepak@gmail.com');
  const [password, setPassword ] = useState('Deepak@456');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  

  const handleLogin = async() => {
    setError('')
    setLoading(true)
    try{
      if (!email || !password) {
        setError("Fill all fields");
        return;
      }
      const res = await axios.post(BASE_URL + "/login", {
        email, password
      }, {withCredentials : true})
      navigate("/boards");
    }catch(err){
      setError(err?.response?.data);
      console.error(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }
  const handleSignUp = async() => {
    setError('')
    setLoading(true)
    try{
      const res = await axios.post(BASE_URL + "/signup", {
        name, email, password
      }, {withCredentials : true})
    }catch(err){
      setError(err?.response?.data);
      console.error(err.response?.data || err.message);
    }
  }
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-3xl font-semibold text-center mb-6">
          {isSignup ? "Create Account" : "Welcome Back"}
        </h1>

        <div className="flex flex-col gap-4">
          {isSignup && (
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={name}
                onChange={(e) => {setName(e.target.value)}}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="example@gmail.com"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => {setEmail(e.target.value)}}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => {setPassword(e.target.value)}}
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button disabled={loading} className="w-full py-2 mt-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer" onClick={isSignup ? handleSignUp : handleLogin}>
            {loading ? "Please wait..." : isSignup ? "Sign up" : "Log in"}
          </button>

          <p
            className="text-sm text-center text-blue-600 cursor-pointer hover:underline"
            onClick={() => setIsSignup(!isSignup)}
          >
            {isSignup ? "Already a user? Login" : "New user? Sign Up"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
