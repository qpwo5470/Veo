// Force home button injection - 강제로 모든 페이지에 홈버튼 표시
(function() {
    function forceInjectHomeButton() {
        // 기존 버튼 제거
        const existing = document.getElementById('veo-home-button');
        if (existing) {
            existing.remove();
        }
        
        // 새 버튼 생성
        const homeButton = document.createElement('button');
        homeButton.id = 'veo-home-button';
        homeButton.style.cssText = `
            position: fixed !important;
            top: 20px !important;
            left: 20px !important;
            width: 50px !important;
            height: 50px !important;
            background: #4285F4 !important;
            border: none !important;
            border-radius: 50% !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
            transition: all 0.3s ease !important;
            z-index: 2147483647 !important;
            visibility: visible !important;
            opacity: 1 !important;
        `;
        
        // SVG 아이콘
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.style.cssText = 'fill: none; stroke: white; stroke-width: 2;';
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M12 2.1L2 10v11h7v-7h6v7h7V10L12 2.1z');
        
        svg.appendChild(path);
        homeButton.appendChild(svg);
        
        // 호버 효과
        homeButton.onmouseover = () => {
            homeButton.style.background = '#3367D6 !important';
            homeButton.style.transform = 'scale(1.1) !important';
        };
        
        homeButton.onmouseout = () => {
            homeButton.style.background = '#4285F4 !important';
            homeButton.style.transform = 'scale(1) !important';
        };
        
        // 클릭 핸들러
        homeButton.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('홈버튼 클릭됨');
            
            // 채팅 삭제 시도
            if (window.deleteAllChats) {
                console.log('채팅 삭제 중...');
                window.deleteAllChats();
            } else {
                console.log('직접 pg1으로 이동 신호 보냄');
                const signal = document.createElement('div');
                signal.id = 'veo-navigate-to-pg1';
                signal.style.display = 'none';
                document.body.appendChild(signal);
            }
        };
        
        // body에 추가
        document.body.appendChild(homeButton);
        console.log('홈버튼 강제 주입 완료');
    }
    
    // 즉시 실행
    forceInjectHomeButton();
    
    // DOM 로드 후 재실행
    if (document.readyState !== 'complete') {
        window.addEventListener('load', forceInjectHomeButton);
    }
    
    // 1초 후 재실행 (동적 콘텐츠 대응)
    setTimeout(forceInjectHomeButton, 1000);
    
    // 3초 후 재실행 (느린 로딩 대응)
    setTimeout(forceInjectHomeButton, 3000);
    
    // 디버그: 현재 URL 출력
    console.log('현재 페이지:', window.location.href);
    console.log('홈버튼 스크립트 로드됨');
})();