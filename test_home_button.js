// 홈버튼 테스트 - 콘솔에서 실행
window.testHomeButton = function() {
    console.log('=== 홈버튼 테스트 ===');
    
    // 현재 페이지 정보
    console.log('현재 URL:', window.location.href);
    console.log('페이지 제목:', document.title);
    
    // 홈버튼 확인
    const homeButton = document.getElementById('veo-home-button');
    if (homeButton) {
        console.log('✅ 홈버튼 발견!');
        console.log('위치:', {
            top: homeButton.style.top,
            left: homeButton.style.left
        });
        console.log('표시 상태:', {
            display: homeButton.style.display,
            visibility: homeButton.style.visibility,
            opacity: homeButton.style.opacity,
            zIndex: homeButton.style.zIndex
        });
        
        // 버튼이 가려져 있는지 확인
        const rect = homeButton.getBoundingClientRect();
        console.log('크기와 위치:', rect);
        
        // 상위 요소 확인
        const elementAtPoint = document.elementFromPoint(rect.left + 25, rect.top + 25);
        if (elementAtPoint === homeButton) {
            console.log('✅ 홈버튼이 최상위에 표시됨');
        } else {
            console.log('❌ 홈버튼이 다른 요소에 가려짐:', elementAtPoint);
        }
    } else {
        console.log('❌ 홈버튼을 찾을 수 없음');
        
        // 수동으로 홈버튼 추가 시도
        console.log('홈버튼 수동 추가 시도...');
        const script = document.createElement('script');
        script.textContent = `(${window.forceInjectHomeButton || function() { console.error('홈버튼 함수 없음'); }})()`;
        document.head.appendChild(script);
    }
    
    console.log('=================');
};

// 자동 실행
window.testHomeButton();