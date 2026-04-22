import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:8000/api/v1" });

export const parseDocument = async (file, mode, question = "") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("mode", mode);
  if (question) formData.append("question", question);
  const res = await API.post("/parse", formData);
  return res.data;
};