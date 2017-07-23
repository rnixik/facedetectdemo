void loadClassifiers(cv::CascadeClassifier& face_cascade, cv::CascadeClassifier& eyes_cascade) {
	face_cascade.load("../../test/data/haarcascade_frontalface_default.xml");
	eyes_cascade.load("../../test/data/haarcascade_eye.xml");
}

void detectFace(const emscripten::val& input, cv::Mat& output, cv::CascadeClassifier face_cascade, cv::CascadeClassifier eyes_cascade) {
	//convert js img
	int w= input["width"].as<unsigned>();
	int h= input["height"].as<unsigned>();
	std::string str = input["data"]["buffer"].as<std::string>();
	const cv::Mat inputMat = cv::Mat(h, w, 24, (void*)str.data(), 0);

	std::vector<cv::Rect> faces;
	cv::Mat frame_gray;

	cv::cvtColor(inputMat, frame_gray, CV_BGR2GRAY);
	//cv::equalizeHist(frame_gray, frame_gray);

	cv::cvtColor(inputMat, output, CV_RGBA2RGB);

	//-- Detect faces
	face_cascade.detectMultiScale(frame_gray, faces, 1.1, 3, 0, cv::Size(0, 0));

	for (size_t i = 0; i < faces.size(); i++)
	{
			cv::Point center(faces[i].x + faces[i].width*0.5, faces[i].y + faces[i].height*0.5);
			cv::ellipse(output, center, cv::Size(faces[i].width*0.5, faces[i].height*0.5), 0, 0, 360, cv::Scalar(255, 0, 255), 4, 8, 0);

			cv::Mat faceROI = frame_gray(faces[i]);
			std::vector<cv::Rect> eyes;

			//-- In each face, detect eyes
			eyes_cascade.detectMultiScale(faceROI, eyes, 1.1, 3, 0, cv::Size(0, 0));

			for (size_t j = 0; j < eyes.size(); j++)
			{
					cv::Point center(faces[i].x + eyes[j].x + eyes[j].width*0.5, faces[i].y + eyes[j].y + eyes[j].height*0.5);
					int radius = cvRound((eyes[j].width + eyes[j].height)*0.25);
					cv::circle(output, center, radius, cv::Scalar(255, 0, 0), 4, 8, 0);
			}
	}
}
