import { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "./layout/SidebarLayout/SidebarLayout";
import {
  MessageScreen,
  ForumScreen,
  ProfileScreen,
  UniversityTestScreen,
  CareerQuizScreen,
  TestTakingScreen,
  MBTIQuizScreen,
  HollandQuizScreen,
  SearchScreen,
  ManageRepresentativeScreen,
  LoginScreen,
  RegisterScreen,
  ForgotPasswordScreen,
  AdminDashboard,
  ManageTestScreen,
  ManageCombinationScreen,
  ManageQuizScreen,
  ManageSoftSkillScreen,
  ManageUserScreen
} from "./screens";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Sidebar />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />

        <Route path="/user" element={<Sidebar />}>
          <Route index element={<ForumScreen />} />
          <Route path="search" element={<SearchScreen />} />
          <Route path="messages" element={<MessageScreen />} />
          <Route path="tests" element={<UniversityTestScreen />} />
          <Route path="tests/:id" element={<TestTakingScreen />} />
          <Route path="quiz" element={<CareerQuizScreen />} />
          <Route path="quiz/mbti" element={<MBTIQuizScreen />} />
          <Route path="quiz/holland" element={<HollandQuizScreen />} />
          <Route path="profile" element={<ProfileScreen />} />
          <Route path="representatives" element={<ManageRepresentativeScreen />} />
        </Route>

        <Route path="/admin" element={<Sidebar />}>
          <Route index element={<AdminDashboard />} />
          <Route path="tests" element={<ManageTestScreen/> } />
          <Route path="combinations" element={<ManageCombinationScreen />} />
          <Route path="quiz" element={<ManageQuizScreen />} />
          <Route path="soft-skills" element={<ManageSoftSkillScreen />} />
          <Route path="users" element={<ManageUserScreen />} />
          <Route path="report" />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
